(function () {
  const config = window.SUPABASE_CONFIG;
  const SESSION_KEY = 'kana-supabase-session-v1';
  let session = null;
  let getLocalProgress = () => ({});
  let applyRemoteProgress = () => {};
  let saveTimer = null;
  let cloudProgress = {};

  const readSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  };

  function storeSession(value) {
    session = value?.access_token ? value : null;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    renderAccount();
  }

  async function readJson(response) {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text); }
    catch { return {}; }
  }

  async function authRequest(path, options = {}) {
    const response = await fetch(`${config.url}/auth/v1/${path}`, {
      ...options,
      headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', ...options.headers }
    });
    const data = await readJson(response);
    if (!response.ok) throw new Error(data.msg || data.message || data.error_description || 'Authentication failed.');
    return data;
  }

  async function ensureSession() {
    if (!session) return null;
    if (session.expires_at && session.expires_at * 1000 > Date.now() + 60000) return session;
    try {
      const refreshed = await authRequest('token?grant_type=refresh_token', {
        method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      storeSession(refreshed);
      return session;
    } catch {
      storeSession(null);
      return null;
    }
  }

  async function progressRequest(path, options = {}) {
    const active = await ensureSession();
    if (!active) throw new Error('Sign in to save your progress.');
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${active.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      const data = await readJson(response);
      throw new Error(data.message || 'Could not sync progress.');
    }
    return response.status === 204 ? null : readJson(response);
  }

  async function loadAndMergeProgress() {
    if (!session?.user?.id) return;
    const rows = await progressRequest(`user_progress?user_id=eq.${encodeURIComponent(session.user.id)}&select=progress`);
    const remote = rows?.[0]?.progress || {};
    cloudProgress = remote;
    await applyRemoteProgress(remote);
    await saveNow();
  }

  async function saveNow() {
    if (!session?.user?.id) return;
    await progressRequest('user_progress?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: session.user.id, progress: (cloudProgress = { ...cloudProgress, ...getLocalProgress() }), updated_at: new Date().toISOString() })
    });
    setSyncStatus('Progress saved');
  }

  function queueSave() {
    if (!session) return;
    clearTimeout(saveTimer);
    setSyncStatus('Saving…');
    saveTimer = setTimeout(() => saveNow().catch(error => setSyncStatus(error.message, true)), 500);
  }

  function setSyncStatus(message, isError = false) {
    const element = document.querySelector('#syncStatus');
    if (!element) return;
    element.textContent = message;
    element.dataset.error = isError ? 'true' : 'false';
  }

  function renderAccount() {
    const signedOut = document.querySelector('#signedOutAccount');
    const signedIn = document.querySelector('#signedInAccount');
    if (!signedOut || !signedIn) return;
    signedOut.hidden = Boolean(session);
    signedIn.hidden = !session;
    document.querySelector('#accountEmail').textContent = session?.user?.email || '';
    document.querySelector('#signOut').hidden = !session;
    setSyncStatus(session ? 'Cloud sync is on' : 'Progress is stored on this device');
  }

  async function signIn(email, password) {
    const data = await authRequest('token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    storeSession(data);
    await loadAndMergeProgress();
  }

  async function signUp(email, password) {
    const redirectTo = config.appUrl || new URL('./', window.location.href).href;
    const data = await authRequest('signup', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        options: { emailRedirectTo: redirectTo }
      })
    });
    if (data.access_token) {
      storeSession(data);
      await loadAndMergeProgress();
      return 'Account created.';
    }
    return 'Check your email to confirm your account.';
  }

  async function signOut() {
    const active = await ensureSession();
    if (active) await authRequest('logout', { method: 'POST', headers: { Authorization: `Bearer ${active.access_token}` } }).catch(() => {});
    storeSession(null);
  }

  function bindUi() {
    const dialog = document.querySelector('#accountDialog');
    document.querySelector('#openAccount').addEventListener('click', () => dialog.showModal());
    document.querySelector('#closeAccount').addEventListener('click', () => dialog.close());
    document.querySelector('#signOut').addEventListener('click', () => signOut());
    document.querySelector('#accountForm').addEventListener('submit', async event => {
      event.preventDefault();
      const action = event.submitter?.value || 'signin';
      const email = document.querySelector('#accountEmailInput').value.trim();
      const password = document.querySelector('#accountPassword').value;
      const status = document.querySelector('#accountStatus');
      status.removeAttribute('data-error');
      status.textContent = action === 'signup' ? 'Creating account…' : 'Signing in…';
      try {
        const message = action === 'signup' ? await signUp(email, password) : (await signIn(email, password), 'Signed in.');
        status.textContent = message;
        if (session) setTimeout(() => dialog.close(), 500);
      } catch (error) {
        status.textContent = error.message;
        status.dataset.error = 'true';
      }
    });
  }

  async function initialize(options) {
    getLocalProgress = options.getLocalProgress;
    applyRemoteProgress = options.applyRemoteProgress;
    bindUi();
    storeSession(readSession());
    if (await ensureSession()) loadAndMergeProgress().catch(error => setSyncStatus(error.message, true));
  }

  window.ProgressSync = { initialize, queueSave };
})();
