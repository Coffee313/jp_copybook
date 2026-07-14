(function () {
  const appleTouchDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  document.documentElement.classList.toggle('apple-fullscreen-ui', appleTouchDevice);
  const updateAppleFullscreenUi = () => {
    if (!appleTouchDevice) return;
    let nativeFullscreenActive = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    try {
      nativeFullscreenActive ||= window.parent !== window
        && Boolean(window.parent.document.fullscreenElement || window.parent.document.webkitFullscreenElement);
    } catch { /* Cross-origin embedding is not used by the app. */ }
    document.documentElement.classList.toggle('apple-native-fullscreen', nativeFullscreenActive);
  };
  document.addEventListener('fullscreenchange', updateAppleFullscreenUi);
  document.addEventListener('webkitfullscreenchange', updateAppleFullscreenUi);
  try {
    if (window.parent !== window) {
      window.parent.document.addEventListener('fullscreenchange', updateAppleFullscreenUi);
      window.parent.document.addEventListener('webkitfullscreenchange', updateAppleFullscreenUi);
    }
  } catch { /* Cross-origin embedding is not used by the app. */ }
  updateAppleFullscreenUi();
  const config = window.SUPABASE_CONFIG;
  const SESSION_KEY = 'kana-supabase-session-v1';
  const PROGRESS_OWNER_KEY = 'kana-progress-owner-v1';
  const STORED_PROGRESS_KEYS = {
    kanaMastery: ['kana-mastery-v1', {}],
    kanaLearned: ['kana-learned-v1', {}],
    kanaMasteryResets: ['kana-mastery-resets-v1', {}],
    kanaPlacement: ['kana-placement-v1', null],
    dictionary: ['kana-kanji-dictionary-v1', []]
  };
  let session = null;
  let getLocalProgress = () => ({});
  let applyRemoteProgress = () => {};
  let replaceLocalProgress = () => {};
  let saveTimer = null;
  let saveInFlight = false;
  let cloudProgress = {};
  let recoveryMode = false;

  const readSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  };

  const readProgressOwner = () => localStorage.getItem(PROGRESS_OWNER_KEY);

  function storeProgressOwner(userId = 'anonymous') {
    localStorage.setItem(PROGRESS_OWNER_KEY, userId);
  }

  function replaceStoredProgress(progress = {}) {
    Object.entries(STORED_PROGRESS_KEYS).forEach(([field, [key, fallback]]) => {
      localStorage.setItem(key, JSON.stringify(progress[field] ?? fallback));
    });
  }

  function sessionFromHash() {
    if (!window.location.hash.includes('access_token=')) return null;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    if (!accessToken) return null;
    try {
      const encodedPayload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
      const bytes = Uint8Array.from(atob(paddedPayload), character => character.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder().decode(bytes));
      return {
        access_token: accessToken,
        refresh_token: params.get('refresh_token') || '',
        expires_at: Number(params.get('expires_at')) || payload.exp,
        expires_in: Number(params.get('expires_in')) || 3600,
        token_type: params.get('token_type') || 'bearer',
        user: { id: payload.sub, email: payload.email }
      };
    } catch {
      return null;
    }
  }

  function storeSession(value) {
    session = value?.access_token ? value : null;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    renderAccount();
  }

  async function readJson(response) {
    const text = await response.text();
    if (!text.trim()) return {};
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

  async function loadAndMergeProgress({ replaceLocal = false } = {}) {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const rows = await progressRequest(`user_progress?user_id=eq.${encodeURIComponent(userId)}&select=progress`);
    if (session?.user?.id !== userId) return;
    const remote = rows?.[0]?.progress || {};
    cloudProgress = remote;
    if (replaceLocal) {
      replaceStoredProgress(remote);
      await replaceLocalProgress(remote);
    } else {
      await applyRemoteProgress(remote);
    }
    storeProgressOwner(userId);
    renderAccount();
    await saveNow();
  }

  async function saveNow({ keepalive = false } = {}) {
    if (!session?.user?.id) return;
    saveInFlight = true;
    try {
      await progressRequest('user_progress?on_conflict=user_id', {
        method: 'POST',
        keepalive,
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: session.user.id, progress: (cloudProgress = { ...cloudProgress, ...getLocalProgress() }), updated_at: new Date().toISOString() })
      });
      renderAccount();
      setSyncStatus('Progress saved');
    } finally {
      saveInFlight = false;
    }
  }

  function queueSave() {
    renderAccount();
    if (!session) return;
    clearTimeout(saveTimer);
    setSyncStatus('Saving…');
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveNow().catch(error => setSyncStatus(error.message, true));
    }, 500);
  }

  window.addEventListener('pagehide', () => {
    if ((!saveTimer && !saveInFlight) || !session) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    saveNow({ keepalive: true }).catch(() => {});
  });

  async function flushSave() {
    renderAccount();
    if (!session) return;
    clearTimeout(saveTimer);
    setSyncStatus('SavingвЂ¦');
    try { await saveNow(); }
    catch (error) { setSyncStatus(error.message, true); }
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
    const email = session?.user?.email || '';
    const accountButton = document.querySelector('#openAccount');
    document.querySelector('#accountEmail').textContent = Array.from(email)[0]?.toUpperCase() || '?';
    accountButton.dataset.signedIn = session ? 'true' : 'false';
    accountButton.setAttribute('aria-label', session ? `Open profile for ${email}` : 'Open profile');
    document.querySelector('#accountForm').hidden = Boolean(session) || recoveryMode;
    document.querySelector('#recoveryForm').hidden = !recoveryMode;
    document.querySelector('#accountSummary').hidden = !session || recoveryMode;
    document.querySelector('#accountTitle').textContent = recoveryMode ? 'Reset password' : session ? 'Profile settings' : 'Your account';
    document.querySelector('#accountIntro').textContent = recoveryMode
      ? 'Choose a new password for your account.'
      : session
        ? `Signed in as ${session.user?.email || 'your account'}. Your progress is synced across devices.`
        : 'Sign in or create an account to save your learning progress.';
    renderAccountStats();
    setSyncStatus(session ? 'Cloud sync is on' : 'Progress is stored on this device');
  }

  function renderAccountStats() {
    const container = document.querySelector('#accountStats');
    if (!container) return;
    container.innerHTML = '';
    if (!session) return;
    const progress = { ...cloudProgress, ...getLocalProgress() };
    let currentGroup = '';
    buildAccountStats(progress).forEach(stat => {
      if (stat.group !== currentGroup) {
        currentGroup = stat.group;
        const heading = document.createElement('h3');
        heading.textContent = currentGroup;
        container.append(heading);
      }
      const item = document.createElement('div');
      const value = document.createElement('strong');
      const label = document.createElement('span');
      value.textContent = stat.value;
      label.textContent = stat.label;
      item.append(value, label);
      container.append(item);
    });
  }

  function buildAccountStats(progress) {
    const mastery = progress.kanaMastery || {};
    let hiragana = 0;
    let katakana = 0;
    Object.entries(mastery).forEach(([character, result]) => {
      if (!result?.passed) return;
      const codePoint = character.codePointAt(0);
      if (codePoint >= 0x3040 && codePoint <= 0x309f) hiragana += 1;
      if (codePoint >= 0x30a0 && codePoint <= 0x30ff) katakana += 1;
    });
    const dictionary = Array.isArray(progress.dictionary) ? progress.dictionary : [];
    const repetitions = dictionary.map(item => Number(item.repetitions) || 0);
    const stats = [
      { group: 'Kana progress', label: 'Hiragana', value: `${hiragana} / 71` },
      { group: 'Kana progress', label: 'Katakana', value: `${katakana} / 71` },
      { group: 'Kanji vocabulary', label: 'In vocabulary', value: String(dictionary.length) },
      { group: 'Kanji vocabulary', label: 'Not learned', value: String(repetitions.filter(value => value === 0).length) },
      { group: 'Kanji vocabulary', label: 'Learned a little', value: String(repetitions.filter(value => value > 0 && value < 3).length) },
      { group: 'Kanji vocabulary', label: 'Learned well', value: String(repetitions.filter(value => value >= 3).length) }
    ];
    if (progress.kanaPlacement?.assignedLevel && !progress.kanaPlacement.skipped) {
      stats.splice(0, 0, { group: 'Kana progress', label: 'Placement', value: progress.kanaPlacement.assignedLevel });
    }
    return stats;
  }

  async function signIn(email, password) {
    const previousOwner = readProgressOwner();
    const data = await authRequest('token?grant_type=password', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    clearTimeout(saveTimer);
    storeSession(data);
    document.querySelector('#accountDialog')?.close();
    await loadAndMergeProgress({ replaceLocal: previousOwner !== data.user?.id })
      .catch(error => setSyncStatus(error.message, true));
  }

  async function signUp(email, password) {
    const redirectTo = config.appUrl || new URL('./', window.location.href).href;
    const data = await authRequest(`signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.access_token) {
      clearTimeout(saveTimer);
      storeSession(data);
      document.querySelector('#accountDialog')?.close();
      await loadAndMergeProgress().catch(error => setSyncStatus(error.message, true));
      return 'Account created.';
    }
    return 'Check your email to confirm your account.';
  }

  async function requestPasswordReset(email) {
    const redirectTo = config.appUrl || new URL('./', window.location.href).href;
    await authRequest(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async function updatePassword(password) {
    const active = await ensureSession();
    if (!active) throw new Error('This password reset link has expired. Request a new one.');
    await authRequest('user', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${active.access_token}` },
      body: JSON.stringify({ password })
    });
  }

  async function signOut() {
    const active = await ensureSession();
    if (active) await authRequest('logout', { method: 'POST', headers: { Authorization: `Bearer ${active.access_token}` } }).catch(() => {});
    clearTimeout(saveTimer);
    storeSession(null);
    cloudProgress = {};
    replaceStoredProgress({});
    await replaceLocalProgress({});
    storeProgressOwner();
    renderAccount();
  }

  function showProfilePanel(panelId = 'profileStatistics') {
    const requested = document.querySelector(`#${panelId}[data-profile-section]`);
    const target = requested || document.querySelector('#profileStatistics');
    document.querySelectorAll('[data-profile-section]').forEach(section => { section.hidden = section !== target; });
    document.querySelectorAll('[data-profile-panel]').forEach(button => button.classList.toggle('active', button.dataset.profilePanel === target?.id));
  }

  function bindUi() {
    const dialog = document.querySelector('#accountDialog');
    document.querySelector('#openAccount').addEventListener('click', () => {
      if (session) showProfilePanel();
      dialog.showModal();
    });
    document.querySelector('#closeAccount').addEventListener('click', () => dialog.close());
    document.querySelector('#signOut').addEventListener('click', async () => {
      await signOut();
      dialog.close();
    });
    document.querySelectorAll('[data-profile-panel]').forEach(button => {
      button.addEventListener('click', () => showProfilePanel(button.dataset.profilePanel));
    });
    document.querySelector('#requestPasswordReset').addEventListener('click', async () => {
      const emailInput = document.querySelector('#accountEmailInput');
      const status = document.querySelector('#accountStatus');
      status.removeAttribute('data-error');
      if (!emailInput.reportValidity()) return;
      status.textContent = 'Sending password reset email…';
      try {
        await requestPasswordReset(emailInput.value.trim());
        status.textContent = 'Check your email for a password reset link.';
      } catch (error) {
        status.textContent = error.message;
        status.dataset.error = 'true';
      }
    });
    document.querySelector('#recoveryForm').addEventListener('submit', async event => {
      event.preventDefault();
      const status = document.querySelector('#recoveryStatus');
      status.removeAttribute('data-error');
      status.textContent = 'Saving new password…';
      try {
        await updatePassword(document.querySelector('#recoveryPassword').value);
        status.textContent = 'Password updated.';
        setTimeout(() => {
          recoveryMode = false;
          renderAccount();
          dialog.close();
        }, 700);
      } catch (error) {
        status.textContent = error.message;
        status.dataset.error = 'true';
      }
    });
    document.querySelector('#profilePasswordForm').addEventListener('submit', async event => {
      event.preventDefault();
      const passwordInput = document.querySelector('#profilePassword');
      const status = document.querySelector('#profilePasswordStatus');
      status.removeAttribute('data-error');
      status.textContent = 'Saving new password…';
      try {
        await updatePassword(passwordInput.value);
        passwordInput.value = '';
        status.textContent = 'Password updated.';
      } catch (error) {
        status.textContent = error.message;
        status.dataset.error = 'true';
      }
    });
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
        if (session && dialog.open) dialog.close();
      } catch (error) {
        status.textContent = error.message;
        status.dataset.error = 'true';
      }
    });
  }

  async function initialize(options) {
    getLocalProgress = options.getLocalProgress;
    applyRemoteProgress = options.applyRemoteProgress;
    replaceLocalProgress = options.replaceLocalProgress || applyRemoteProgress;
    bindUi();
    const requestedProfileReset = window.location.hash === '#profile-reset';
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hasAuthHash = hashParams.has('access_token');
    recoveryMode = hasAuthHash && hashParams.get('type') === 'recovery';
    const callbackSession = sessionFromHash();
    const storedSession = readSession();
    storeSession(callbackSession || storedSession);
    if (hasAuthHash) history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (recoveryMode && callbackSession) {
      renderAccount();
      document.querySelector('#accountDialog').showModal();
      document.querySelector('#recoveryPassword').focus();
    }
    if (await ensureSession()) {
      const owner = readProgressOwner() || (!callbackSession ? storedSession?.user?.id : null);
      const adoptAnonymousSignup = callbackSession && hashParams.get('type') === 'signup' && (!owner || owner === 'anonymous');
      await loadAndMergeProgress({ replaceLocal: owner !== session.user.id && !adoptAnonymousSignup })
        .catch(error => setSyncStatus(error.message, true));
    }
    if (requestedProfileReset && session) {
      showProfilePanel('profileResetProgress');
      document.querySelector('#accountDialog').showModal();
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }

  window.ProgressSync = { initialize, queueSave, flushSave };
})();
