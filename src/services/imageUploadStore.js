(function () {
  function getSupabaseClient() {
    if (!window.GreenCampSupabase || typeof window.GreenCampSupabase.createSupabaseClient !== 'function') {
      return null;
    }

    if (!window.__greencampSupabaseClient) {
      window.__greencampSupabaseClient = window.GreenCampSupabase.createSupabaseClient();
    }

    return window.__greencampSupabaseClient;
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Falha ao ler imagem local.'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadProductImage(file, productSlug) {
    if (!file) throw new Error('Selecione um arquivo de imagem.');
    const safeSlug = String(productSlug || 'produto').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();

    const supabase = getSupabaseClient();
    if (!supabase) {
      const dataUrl = await readAsDataUrl(file);
      return { url: dataUrl, source: 'local' };
    }

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `products/${safeSlug}-${Date.now()}.${ext}`;
      const bucket = 'product-images';

      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: data.publicUrl, source: 'supabase' };
    } catch {
      const dataUrl = await readAsDataUrl(file);
      return { url: dataUrl, source: 'local' };
    }
  }

  window.GreenCampImageUploadStore = {
    uploadProductImage,
  };
})();
