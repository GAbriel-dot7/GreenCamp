(function () {
  const SESSION_KEY = 'greencamp.admin.session';

  function getSupabaseClient() {
    if (!window.GreenCampSupabase || typeof window.GreenCampSupabase.createSupabaseClient !== 'function') {
      return null;
    }

    if (!window.__greencampSupabaseClient) {
      window.__greencampSupabaseClient = window.GreenCampSupabase.createSupabaseClient();
    }

    return window.__greencampSupabaseClient;
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function writeSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('greencamp:admin-session-changed', { detail: session }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('greencamp:admin-session-changed', { detail: null }));
  }

  async function signIn(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const fallbackSession = { email, mode: 'local', loggedAt: new Date().toISOString() };
      writeSession(fallbackSession);
      return { session: fallbackSession, user: fallbackSession, fallback: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const session = {
      email: data.user.email,
      id: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      mode: 'supabase',
      loggedAt: new Date().toISOString(),
    };

    writeSession(session);
    return { session, user: data.user, fallback: false };
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearSession();
  }

  function getAuthHeader() {
    const session = readSession();
    if (!session || !session.accessToken) return null;
    return `Bearer ${session.accessToken}`;
  }

  function isAuthenticated() {
    return Boolean(readSession());
  }

  window.GreenCampAdminAuth = {
    readSession,
    writeSession,
    clearSession,
    signIn,
    signOut,
    isAuthenticated,
    getAuthHeader,
  };
})();
