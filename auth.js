const SESSION_KEY = 'kitsune-cloud-user';
const OFFLINE_ADMIN = { email: 'admin@kitsune.local', password: 'admin123', id: 'offline-admin', name: 'Administrador', isAdmin: true };
let loginMode = 'login';
const activeUser = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };

function setAuthMode(mode) {
  loginMode = mode;
  const register = mode === 'register';
  document.querySelector('#authKicker').textContent = register ? 'COMECE AGORA' : 'BEM-VINDO DE VOLTA';
  document.querySelector('#authTitle').textContent = register ? 'Crie seu universo' : 'Entre no seu universo';
  document.querySelector('#authSub').textContent = register ? 'Sua biblioteca, seu ritmo, suas regras.' : 'Acompanhe exatamente de onde parou.';
  document.querySelector('#authNameField').hidden = !register;
  document.querySelector('.auth-submit').innerHTML = register ? 'Criar minha conta <b>→</b>' : 'Entrar <b>→</b>';
  document.querySelector('#authSwitch').innerHTML = register ? 'Já tem uma conta? <button type="button">Entrar</button>' : 'Ainda não tem uma conta? <button type="button">Crie sua conta</button>';
  document.querySelector('#authError').textContent = '';
}
function paintUser(user) {
  document.querySelector('#authScreen').hidden = !!user;
  if (!user) return;
  document.querySelector('#profileName').textContent = user.name;
  document.querySelector('#profileInitial').textContent = user.name[0].toUpperCase();
  document.querySelector('#pageTitle').innerHTML = `Olá, ${user.name.split(' ')[0]} <span>✦</span>`;
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
    document.querySelector('#authError').textContent = 'Modo local: entre com o administrador padrão para visualizar o sistema.';
  }
  document.querySelector('#authSwitch').addEventListener('click', () => {
    if (!client) { document.querySelector('#authError').textContent = 'Cadastro exige o banco configurado. Use o administrador padrão nesta visualização.'; return; }
    setAuthMode(loginMode === 'login' ? 'register' : 'login');
  });
  document.querySelector('#authForm').addEventListener('submit', async event => {
    event.preventDefault();
    const name = document.querySelector('#authName').value.trim();
    const email = document.querySelector('#authEmail').value.trim().toLowerCase();
    const password = document.querySelector('#authPassword').value;
    const error = document.querySelector('#authError');
    if (!client) {
      if (email === OFFLINE_ADMIN.email && password === OFFLINE_ADMIN.password) { cacheUser(OFFLINE_ADMIN); location.reload(); return; }
      error.textContent = 'Use admin@kitsune.local e a senha admin123.'; return;
    }
    if (!email || password.length < 6 || (loginMode === 'register' && !name)) { error.textContent = 'Preencha os campos; a senha deve ter pelo menos 6 caracteres.'; return; }
    const submit = document.querySelector('.auth-submit'); submit.disabled = true; submit.textContent = 'Aguarde...';
    const result = loginMode === 'register' ? await client.auth.signUp({ email, password, options: { data: { full_name: name } } }) : await client.auth.signInWithPassword({ email, password });
    submit.disabled = false;
    if (result.error) { error.textContent = result.error.message; setAuthMode(loginMode); return; }
    if (loginMode === 'register' && !result.data.session) { error.textContent = 'Conta criada. Confira seu e-mail para confirmar o acesso.'; return; }
    cacheUser(result.data.user); location.reload();
  });
  document.querySelector('#logout').addEventListener('click', async () => { if (client) await client.auth.signOut(); localStorage.removeItem(SESSION_KEY); location.reload(); });
});
