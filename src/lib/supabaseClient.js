function createSupabaseClient() {
  const supabaseUrl = window.GREENCAMP_SUPABASE_URL;
  const supabaseAnonKey = window.GREENCAMP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !window.supabase) {
    return null;
  }

  return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
}

window.GreenCampSupabase = {
  createSupabaseClient,
};
