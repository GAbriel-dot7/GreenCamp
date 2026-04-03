(function () {
  const STORAGE_KEY = 'greencamp.menu.catalog';

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
  }

  function safeParseJson(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function getEmptyCatalog() {
    return { categories: [], products: [] };
  }

  function readCatalog() {
    return safeParseJson(localStorage.getItem(STORAGE_KEY), getEmptyCatalog());
  }

  function writeCatalog(catalog) {
    const nextCatalog = {
      categories: Array.isArray(catalog.categories) ? catalog.categories : [],
      products: Array.isArray(catalog.products) ? catalog.products : [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCatalog));
    window.dispatchEvent(new CustomEvent('greencamp:catalog-updated', { detail: nextCatalog }));
    return nextCatalog;
  }

  function replaceCatalog(catalog) {
    return writeCatalog(catalog);
  }

  function seedIfEmpty(categories, products) {
    const current = readCatalog();
    if (current.categories.length || current.products.length) return current;
    return writeCatalog({ categories: categories || [], products: products || [] });
  }

  function getCatalog() {
    return readCatalog();
  }

  function upsertCategory(category) {
    const catalog = readCatalog();
    const id = category.id || slugify(category.name);
    const currentCategory = catalog.categories.find((item) => item.id === id) || {};
    const nextCategory = {
      ...currentCategory,
      ...category,
      id,
      name: category.name,
    };

    const categories = catalog.categories.filter((item) => item.id !== id);
    categories.push(nextCategory);
    categories.sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));

    return writeCatalog({ categories, products: catalog.products });
  }

  function deleteCategory(categoryId) {
    const catalog = readCatalog();
    const categories = catalog.categories.filter((item) => item.id !== categoryId);
    const products = catalog.products.filter((item) => item.cat !== categoryId);
    return writeCatalog({ categories, products });
  }

  function upsertProduct(product) {
    const catalog = readCatalog();
    const id = product.id || slugify(product.name);
    const currentProduct = catalog.products.find((item) => item.id === id) || {};
    const nextProduct = {
      ...currentProduct,
      ...product,
      id,
      cat: product.cat,
      name: product.name,
      desc: product.desc || '',
      type: product.type || 'simple',
      price: Number(product.price || 0),
      image_url: product.image_url || '',
      available: product.available !== false,
      variations: Array.isArray(product.variations) ? product.variations : [],
      groups: Array.isArray(product.groups) ? product.groups : [],
      items: Array.isArray(product.items) ? product.items : [],
    };

    const products = catalog.products.filter((item) => item.id !== id);
    products.push(nextProduct);
    products.sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));

    return writeCatalog({ categories: catalog.categories, products });
  }

  function deleteProduct(productId) {
    const catalog = readCatalog();
    const products = catalog.products.filter((item) => item.id !== productId);
    return writeCatalog({ categories: catalog.categories, products });
  }

  function getCategoryLabel(categoryId, categories = null) {
    const catalog = categories ? { categories } : readCatalog();
    const category = catalog.categories.find((item) => item.id === categoryId);
    return category ? category.name : categoryId;
  }

  window.GreenCampMenuCatalogStore = {
    slugify,
    seedIfEmpty,
    getCatalog,
    replaceCatalog,
    upsertCategory,
    deleteCategory,
    upsertProduct,
    deleteProduct,
    getCategoryLabel,
  };
})();
