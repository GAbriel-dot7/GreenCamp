(function () {
  const STORAGE_KEY = 'greencamp.orders';
  const RESTAURANT_ID = 'greencamp';
  const REALTIME_CHANNEL = 'orders-realtime-greencamp';

  function getSupabaseClient() {
    if (!window.GreenCampSupabase || typeof window.GreenCampSupabase.createSupabaseClient !== 'function') {
      return null;
    }

    if (!window.__greencampSupabaseClient) {
      window.__greencampSupabaseClient = window.GreenCampSupabase.createSupabaseClient();
    }

    return window.__greencampSupabaseClient;
  }

  function readLocalOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeLocalOrders(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  function toSupabaseOrder(payload) {
    return {
      id: isUuid(payload.id) ? payload.id : (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : undefined),
      restaurant_id: payload.restaurantId || 'greencamp',
      customer_name: payload.customerName || null,
      customer_phone: payload.customerPhone || null,
      order_type: payload.orderType || 'retirada',
      status: payload.status,
      notes: payload.notes || null,
      subtotal: payload.total,
      total: payload.total,
      items: payload.items,
      printer_text: payload.printerText || null,
      source: payload.source || 'cardapio',
      created_at: payload.createdAt,
      updated_at: payload.updatedAt,
    };
  }

  function fromSupabaseOrder(row, fallback = {}) {
    return {
      id: row.id || fallback.id,
      restaurantId: row.restaurant_id || fallback.restaurantId,
      customerName: row.customer_name || fallback.customerName || '',
      customerPhone: row.customer_phone || fallback.customerPhone || '',
      orderType: row.order_type || fallback.orderType || 'retirada',
      status: row.status || fallback.status || 'novo',
      notes: row.notes || fallback.notes || '',
      total: Number(row.total || fallback.total || 0),
      subtotal: Number(row.subtotal || fallback.subtotal || fallback.total || 0),
      items: Array.isArray(row.items) ? row.items : (Array.isArray(fallback.items) ? fallback.items : []),
      printerText: row.printer_text || fallback.printerText || null,
      source: row.source || fallback.source || 'cardapio',
      createdAt: row.created_at || fallback.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || fallback.updatedAt || new Date().toISOString(),
    };
  }

  async function fetchSupabaseOrders() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
      return null;
    }

    const mapped = data.map((row) => fromSupabaseOrder(row));
    window.__greencampOrdersCache = mapped;
    return mapped;
  }

  async function persistOrder(order) {
    const payload = {
      ...order,
      id: order.id || `order_${Date.now()}`,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: order.status || 'novo',
    };

    const supabase = getSupabaseClient();

    if (supabase) {
      const supabasePayload = toSupabaseOrder(payload);
      const { data, error } = await supabase
        .from('orders')
        .insert(supabasePayload)
        .select()
        .single();

      if (!error) {
        return fromSupabaseOrder(data || {}, payload);
      }
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch {
      const orders = readLocalOrders();
      orders.unshift(payload);
      writeLocalOrders(orders);
      return payload;
    }
  }

  function listOrders() {
    const supabase = getSupabaseClient();

    if (supabase) {
      if (!window.__greencampOrdersLoading) {
        window.__greencampOrdersLoading = true;
        fetchSupabaseOrders()
          .finally(() => {
            window.__greencampOrdersLoading = false;
          });
      }

      if (Array.isArray(window.__greencampOrdersCache)) {
        return window.__greencampOrdersCache;
      }
    }

    return readLocalOrders();
  }

  async function refreshOrders() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return readLocalOrders();
    }

    const data = await fetchSupabaseOrders();
    return Array.isArray(data) ? data : (Array.isArray(window.__greencampOrdersCache) ? window.__greencampOrdersCache : []);
  }

  async function clearAllOrders() {
    const supabase = getSupabaseClient();

    if (supabase) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('restaurant_id', RESTAURANT_ID);

      if (!error) {
        window.__greencampOrdersCache = [];
      }
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures so the admin remains usable.
    }

    window.__greencampOrdersCache = [];
    window.__greencampOrdersLoading = false;
    return [];
  }

  function subscribeOrders(onChange) {
    const supabase = getSupabaseClient();
    if (!supabase || typeof onChange !== 'function') {
      return null;
    }

    const channel = supabase
      .channel(REALTIME_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${RESTAURANT_ID}`,
        },
        async () => {
          await refreshOrders();
          onChange();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function updateOrderStatus(orderId, status) {
    const supabase = getSupabaseClient();

    if (supabase) {
      supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .then(({ error }) => {
          if (!error) {
            window.__greencampOrdersCache = null;
          }
        });
    }

    const orders = readLocalOrders();
    const updatedOrders = orders.map((order) => (
      order.id === orderId
        ? { ...order, status, updatedAt: new Date().toISOString() }
        : order
    ));
    writeLocalOrders(updatedOrders);
    return updatedOrders.find((order) => order.id === orderId) || null;
  }

  window.GreenCampOrderStore = {
    persistOrder,
    listOrders,
    refreshOrders,
    clearAllOrders,
    subscribeOrders,
    updateOrderStatus,
  };
})();
