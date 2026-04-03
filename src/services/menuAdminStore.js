(function () {
  const RESTAURANT_ID = 'greencamp';

  function getSupabaseClient() {
    if (!window.GreenCampSupabase || typeof window.GreenCampSupabase.createSupabaseClient !== 'function') {
      return null;
    }

    if (!window.__greencampSupabaseClient) {
      window.__greencampSupabaseClient = window.GreenCampSupabase.createSupabaseClient();
    }

    return window.__greencampSupabaseClient;
  }

  function slugify(value) {
    if (window.GreenCampMenuCatalogStore && typeof window.GreenCampMenuCatalogStore.slugify === 'function') {
      return window.GreenCampMenuCatalogStore.slugify(value);
    }

    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
  }

  function getLocalCatalog() {
    if (!window.GreenCampMenuCatalogStore || typeof window.GreenCampMenuCatalogStore.getCatalog !== 'function') {
      return { categories: [], products: [] };
    }
    return window.GreenCampMenuCatalogStore.getCatalog();
  }

  function replaceLocalCatalog(catalog) {
    if (!window.GreenCampMenuCatalogStore || typeof window.GreenCampMenuCatalogStore.replaceCatalog !== 'function') {
      return catalog;
    }
    return window.GreenCampMenuCatalogStore.replaceCatalog(catalog);
  }

  async function syncCatalogFromSupabase() {
    const localCatalog = getLocalCatalog();
    const supabase = getSupabaseClient();

    if (!supabase) {
      return { catalog: localCatalog, source: 'local' };
    }

    try {
      const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, slug, sort_order')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('id, category_id, name, slug, description, base_price, image_url, product_type, available, sort_order')
          .eq('restaurant_id', RESTAURANT_ID)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
      ]);

      if (categoriesError || productsError || !Array.isArray(categories) || !Array.isArray(products)) {
        return { catalog: localCatalog, source: 'local' };
      }

      const categoryByDbId = new Map();
      const mappedCategories = categories.map((category) => {
        const mapped = {
          id: category.slug,
          name: category.name,
          dbId: category.id,
          sortOrder: category.sort_order || 0,
        };
        categoryByDbId.set(category.id, mapped);
        return mapped;
      });

      const localBySlug = new Map((localCatalog.products || []).map((item) => [item.id, item]));
      const mappedProducts = products.map((product) => {
        const category = categoryByDbId.get(product.category_id);
        const localSnapshot = localBySlug.get(product.slug) || {};

        return {
          id: product.slug,
          dbId: product.id,
          cat: category ? category.id : localSnapshot.cat,
          name: product.name,
          desc: product.description || '',
          type: product.product_type || localSnapshot.type || 'simple',
          price: Number(product.base_price || 0),
          image_url: product.image_url || '',
          available: product.available !== false,
          variations: Array.isArray(localSnapshot.variations) ? localSnapshot.variations : [],
          groups: Array.isArray(localSnapshot.groups) ? localSnapshot.groups : [],
          items: Array.isArray(localSnapshot.items) ? localSnapshot.items : [],
          sortOrder: product.sort_order || 0,
        };
      });

      const nextCatalog = {
        categories: mappedCategories,
        products: mappedProducts,
      };

      replaceLocalCatalog(nextCatalog);
      return { catalog: nextCatalog, source: 'supabase' };
    } catch {
      return { catalog: localCatalog, source: 'local' };
    }
  }

  async function resolveCategoryDbId(categorySlug, categoryDbId) {
    if (categoryDbId) return categoryDbId;
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', RESTAURANT_ID)
      .eq('slug', categorySlug)
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  }

  async function saveCategory(category) {
    const normalized = {
      ...category,
      id: category.id || slugify(category.name),
      name: category.name,
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload = {
        id: normalized.dbId || undefined,
        restaurant_id: RESTAURANT_ID,
        name: normalized.name,
        slug: normalized.id,
        sort_order: Number(normalized.sortOrder || 0),
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { data } = await supabase
        .from('categories')
        .upsert(payload, { onConflict: 'restaurant_id,slug' })
        .select('id, slug, name, sort_order')
        .single();

      if (data) {
        normalized.dbId = data.id;
      }
    }

    window.GreenCampMenuCatalogStore.upsertCategory(normalized);
    return normalized;
  }

  async function removeCategory(category) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const query = supabase
        .from('categories')
        .delete()
        .eq('restaurant_id', RESTAURANT_ID);

      if (category.dbId) {
        await query.eq('id', category.dbId);
      } else {
        await query.eq('slug', category.id);
      }
    }

    window.GreenCampMenuCatalogStore.deleteCategory(category.id);
    return true;
  }

  async function saveProduct(product) {
    const normalized = {
      ...product,
      id: product.id || slugify(product.name),
      type: product.type || 'simple',
      price: Number(product.price || 0),
      available: product.available !== false,
      variations: Array.isArray(product.variations) ? product.variations : [],
      groups: Array.isArray(product.groups) ? product.groups : [],
      items: Array.isArray(product.items) ? product.items : [],
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const categoryDbId = await resolveCategoryDbId(normalized.cat, normalized.categoryDbId);
      if (categoryDbId) {
        const payload = {
          id: normalized.dbId || undefined,
          restaurant_id: RESTAURANT_ID,
          category_id: categoryDbId,
          name: normalized.name,
          slug: normalized.id,
          description: normalized.desc || null,
          base_price: normalized.price,
          image_url: normalized.image_url || null,
          product_type: normalized.type,
          available: normalized.available,
          sort_order: Number(normalized.sortOrder || 0),
          updated_at: new Date().toISOString(),
        };

        const { data } = await supabase
          .from('products')
          .upsert(payload, { onConflict: 'restaurant_id,slug' })
          .select('id, category_id')
          .single();

        if (data) {
          normalized.dbId = data.id;
          normalized.categoryDbId = data.category_id;
        }
      }
    }

    window.GreenCampMenuCatalogStore.upsertProduct(normalized);
    return normalized;
  }

  async function removeProduct(product) {
    const supabase = getSupabaseClient();
    if (supabase) {
      const query = supabase
        .from('products')
        .delete()
        .eq('restaurant_id', RESTAURANT_ID);

      if (product.dbId) {
        await query.eq('id', product.dbId);
      } else {
        await query.eq('slug', product.id);
      }
    }

    window.GreenCampMenuCatalogStore.deleteProduct(product.id);
    return true;
  }

  window.GreenCampMenuAdminStore = {
    syncCatalogFromSupabase,
    saveCategory,
    removeCategory,
    saveProduct,
    removeProduct,
  };
})();
