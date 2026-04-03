(function () {
  const RESTAURANT_ID = 'greencamp';
  const MENU_REALTIME_CHANNEL = 'menu-realtime-greencamp';

  function getSupabaseClient() {
    if (!window.GreenCampSupabase || typeof window.GreenCampSupabase.createSupabaseClient !== 'function') {
      return null;
    }

    if (!window.__greencampSupabaseClient) {
      window.__greencampSupabaseClient = window.GreenCampSupabase.createSupabaseClient();
    }

    return window.__greencampSupabaseClient;
  }

  function readLocalCatalog() {
    if (!window.GreenCampMenuCatalogStore || typeof window.GreenCampMenuCatalogStore.getCatalog !== 'function') {
      return null;
    }

    const catalog = window.GreenCampMenuCatalogStore.getCatalog();
    if (!catalog || !Array.isArray(catalog.categories) || !Array.isArray(catalog.products)) {
      return null;
    }

    if (!catalog.categories.length || !catalog.products.length) {
      return null;
    }

    return {
      categories: catalog.categories,
      products: catalog.products,
      source: 'local-catalog',
    };
  }

  function mapCategory(row) {
    return {
      id: row.slug || row.id,
      name: row.name,
      sortOrder: row.sort_order || 0,
    };
  }

  function mapProduct(row, groupsByProductId) {
    const relatedGroups = groupsByProductId.get(row.id) || [];

    const mappedGroups = relatedGroups.map((group) => ({
      id: group.id,
      name: group.name,
      type: group.group_type || 'single',
      required: Boolean(group.required),
      max: group.max_selected || undefined,
      options: (group.options || []).map((option) => ({
        id: option.id,
        label: option.label,
        price: Number(option.price_delta || 0),
      })),
    }));

    const product = {
      id: row.slug || row.id,
      cat: row.category_slug || row.category_id,
      name: row.name,
      desc: row.description || '',
      type: row.product_type || 'simple',
      price: Number(row.base_price || 0),
      image_url: row.image_url || null,
      available: row.available !== false,
    };

    if (product.type === 'variation' && mappedGroups.length) {
      product.variations = mappedGroups[0].options.map((option) => ({
        id: option.id,
        label: option.label,
        price: option.price,
      }));
      if (!product.variations.length) {
        product.type = 'simple';
      }
    } else if (product.type === 'configurable') {
      product.groups = mappedGroups;
    } else if (product.type === 'combo') {
      product.items = row.items || [];
    }

    if (product.type === 'variation' && !product.variations) {
      product.type = 'simple';
    }

    return product;
  }

  async function loadMenuData(localFallback) {
    const localCatalog = readLocalCatalog();
    const supabase = getSupabaseClient();

    if (!supabase) {
      if (localCatalog) return localCatalog;
      return { ...localFallback, source: 'local' };
    }

    try {
      const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, slug, sort_order, is_active, restaurant_id')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('id, restaurant_id, category_id, name, slug, description, base_price, image_url, product_type, available, sort_order')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('available', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
      ]);

      if (categoriesError || productsError || !categories?.length || !products?.length) {
        if (localCatalog) return localCatalog;
        return { ...localFallback, source: 'local' };
      }

      const categoryIds = categories.map((category) => category.id);
      const productIds = products.map((product) => product.id);

      const { data: groups } = await supabase
        .from('product_groups')
        .select('id, product_id, name, group_type, required, min_selected, max_selected, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true });

      const groupIds = (groups || []).map((group) => group.id);
      const { data: options } = groupIds.length
        ? await supabase
          .from('product_group_options')
          .select('id, group_id, label, price_delta, sort_order')
          .in('group_id', groupIds)
          .order('sort_order', { ascending: true })
        : { data: [] };

      const optionsByGroupId = new Map();
      (options || []).forEach((option) => {
        const list = optionsByGroupId.get(option.group_id) || [];
        list.push(option);
        optionsByGroupId.set(option.group_id, list);
      });

      const groupsByProductId = new Map();
      (groups || []).forEach((group) => {
        const groupOptions = optionsByGroupId.get(group.id) || [];
        const existing = groupsByProductId.get(group.product_id) || [];
        existing.push({ ...group, options: groupOptions });
        groupsByProductId.set(group.product_id, existing);
      });

      const categoryLookup = new Map(categories.map((category) => [category.id, mapCategory(category)]));
      const normalizedCategories = categoryIds
        .map((id) => categoryLookup.get(id))
        .filter(Boolean);

      const normalizedProducts = products.map((product) => {
        const category = categories.find((item) => item.id === product.category_id);
        return mapProduct({ ...product, category_slug: category ? category.slug : product.category_id }, groupsByProductId);
      });

      return {
        categories: normalizedCategories,
        products: normalizedProducts,
        source: 'supabase',
      };
    } catch {
      if (localCatalog) return localCatalog;
      return { ...localFallback, source: 'local' };
    }
  }

  function subscribeMenuChanges(onChange) {
    const supabase = getSupabaseClient();
    if (!supabase || typeof onChange !== 'function') {
      return null;
    }

    const channel = supabase
      .channel(MENU_REALTIME_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `restaurant_id=eq.${RESTAURANT_ID}`,
        },
        onChange,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `restaurant_id=eq.${RESTAURANT_ID}`,
        },
        onChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  window.GreenCampMenuStore = {
    loadMenuData,
    subscribeMenuChanges,
  };
})();
