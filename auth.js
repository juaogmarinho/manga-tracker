const SESSION_KEY = 'kitsune-cloud-user';
const LOCAL_USERS_KEY = 'kitsune-local-users';
const OFFLINE_ADMIN = { email: 'admin@kitsune.local', password: 'admin123', id: 'offline-admin', name: 'Administrador', isAdmin: true };
let loginMode = 'login';
const activeUser = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
function loadLocalUsers() { try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)) || {}; } catch { return {}; } }
function saveLocalUsers(users) { localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); }
function getLocalUser(email, password) {
  const users = loadLocalUsers();
  const entry = Object.values(users).find(user => user.email.toLowerCase() === String(email).toLowerCase() && user.password === password);
  return entry || null;
}
function createLocalUser({ name, email, password }) {
  const users = loadLocalUsers();
  const key = String(email).trim().toLowerCase();
  if (users[key]) return { error: 'Este e-mail jÃ¡ estÃ¡ cadastrado no modo local.' };
  const user = { id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`, email: key, name: String(name).trim() || key.split('@')[0], password: String(password), isAdmin: false };
  users[key] = user;
  saveLocalUsers(users);
  return { data: { user } };
}

function setAuthMode(mode) {
  loginMode = mode;
  const register = mode === 'register';
  document.querySelector('#authKicker').textContent = register ? 'COMECE AGORA' : 'BEM-VINDO DE VOLTA';
  document.querySelector('#authTitle').textContent = register ? 'Crie seu universo' : 'Entre no seu universo';
  document.querySelector('#authSub').textContent = register ? 'Sua biblioteca, seu ritmo, suas regras.' : 'Acompanhe exatamente de onde parou.';
  document.querySelector('#authNameField').hidden = !register;
  document.querySelector('.auth-submit').innerHTML = register ? 'Criar minha conta <b>â†’</b>' : 'Entrar <b>â†’</b>';
  document.querySelector('#authSwitch').innerHTML = register ? 'JÃ¡ tem uma conta? <button type="button">Entrar</button>' : 'Ainda nÃ£o tem uma conta? <button type="button">Crie sua conta</button>';
  document.querySelector('#authError').textContent = '';
}
function paintUser(user) {
  document.querySelector('#authScreen').hidden = !!user;
  if (!user) return;
  document.querySelector('#profileName').textContent = user.name;
  const initialEl = document.querySelector('#profileInitial');
  if (user.avatar) {
    initialEl.style.backgroundImage = `url('${user.avatar}')`;
    initialEl.style.backgroundSize = 'cover';
    initialEl.style.backgroundPosition = 'center';
    initialEl.textContent = '';
  } else {
    initialEl.style.backgroundImage = '';
    initialEl.textContent = user.name[0].toUpperCase();
  }
  document.querySelector('#pageTitle').innerHTML = `OlÃ¡, ${user.name.split(' ')[0]} <span>âœ¦</span>`;
}
function updateCachedUser(patch) {
  const user = activeUser();
  if (!user) return null;
  const updated = { ...user, ...patch };
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  paintUser(updated);
  return updated;
}
function cacheUser(user) {
  const saved = { id: user.id, email: user.email, name: user.user_metadata?.full_name || user.name || user.email.split('@')[0], isAdmin: !!user.isAdmin };
  localStorage.setItem(SESSION_KEY, JSON.stringify(saved));
}
document.addEventListener('DOMContentLoaded', async () => {
  paintUser(activeUser());
  const client = await window.cloudReady;
  if (client) {
    const { data: { session } } = await client.auth.getSession();
    if (session && !activeUser()) { cacheUser(session.user); location.reload(); return; }
  } else {
    document.querySelector('#authEmail').value = OFFLINE_ADMIN.email;
    document.querySelector('#authPassword').value = OFFLINE_ADMIN.password;
    document.querySelector('#authError').textContent = 'Modo local: entre com o administrador padrÃ£o para visualizar o sistema.';
  }
  document.querySelector('#authSwitch').addEventListener('click', () => {
    setAuthMode(loginMode === 'login' ? 'register' : 'login');
  });
  document.querySelector('#authForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = document.querySelector('#authName').value.trim();
    const email = document.querySelector('#authEmail').value.trim().toLowerCase();
    const password = document.querySelector('#authPassword').value;
    const error = document.querySelector('#authError');
    if (!email || password.length < 6 || (loginMode === 'register' && !name)) { error.textContent = 'Preencha os campos; a senha deve ter pelo menos 6 caracteres.'; return; }
    const submit = document.querySelector('.auth-submit'); submit.disabled = true; submit.textContent = 'Aguarde...';

    const finishLocalLogin = user => {
      cacheUser(user);
      submit.disabled = false;
      location.reload();
    };

    if (!client) {
      if (loginMode === 'register') {
        const result = createLocalUser({ name, email, password });
        submit.disabled = false;
        if (result.error) { error.textContent = result.error; return; }
        finishLocalLogin(result.data.user);
        return;
      }
      const adminMatch = email === OFFLINE_ADMIN.email && password === OFFLINE_ADMIN.password;
      const localMatch = getLocalUser(email, password);
      submit.disabled = false;
      if (adminMatch) { finishLocalLogin(OFFLINE_ADMIN); return; }
      if (localMatch) { finishLocalLogin(localMatch); return; }
      error.textContent = 'Credenciais invÃ¡lidas. Use admin@kitsune.local / admin123 ou cadastre uma conta local.'; return;
    }

    try {
      const result = loginMode === 'register'
        ? await client.auth.signUp({ email, password, options: { data: { full_name: name } } })
        : await client.auth.signInWithPassword({ email, password });

      if (result?.error) {
        const msg = String(result.error.message || '').toLowerCase();
        const fallbackLocal = loginMode === 'register' ? createLocalUser({ name, email, password }) : null;
        if (fallbackLocal && !fallbackLocal.error) {
          finishLocalLogin(fallbackLocal.data.user);
          return;
        }
        if (loginMode !== 'register') {
          const adminMatch = email === OFFLINE_ADMIN.email && password === OFFLINE_ADMIN.password;
          const localMatch = getLocalUser(email, password);
          if (adminMatch) { finishLocalLogin(OFFLINE_ADMIN); return; }
          if (localMatch) { finishLocalLogin(localMatch); return; }
        }
        if (msg.includes('not found') || msg.includes('invalid login') || msg.includes('failed') || msg.includes('config') || msg.includes('400') || msg.includes('fetch')) {
          if (loginMode === 'register') {
            const created = createLocalUser({ name, email, password });
            if (!created.error) { finishLocalLogin(created.data.user); return; }
          }
        }
        error.textContent = result.error.message;
        setAuthMode(loginMode);
        return;
      }

      if (loginMode === 'register' && !result?.data?.session) {
        error.textContent = 'Conta criada. Confira seu e-mail para confirmar o acesso.';
        submit.disabled = false;
        return;
      }

      cacheUser(result.data.user);
      location.reload();
    } catch (err) {
      const fallback = loginMode === 'register' ? createLocalUser({ name, email, password }) : null;
      if (loginMode === 'register' && fallback && !fallback.error) {
        finishLocalLogin(fallback.data.user);
        return;
      }
      const adminMatch = email === OFFLINE_ADMIN.email && password === OFFLINE_ADMIN.password;
      const localMatch = getLocalUser(email, password);
      if (adminMatch) { finishLocalLogin(OFFLINE_ADMIN); return; }
      if (localMatch) { finishLocalLogin(localMatch); return; }
      error.textContent = 'NÃ£o foi possÃ­vel completar a autenticaÃ§Ã£o. Tente novamente.';
      submit.disabled = false;
    }
  });
  document.querySelector('#logout').addEventListener('click', async () => { if (client) await client.auth.signOut(); localStorage.removeItem(SESSION_KEY); location.reload(); });
});

