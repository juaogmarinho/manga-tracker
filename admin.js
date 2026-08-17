const LOCAL_SETTINGS_KEY = 'kitsune-local-settings';
function applySettings(settings) {
  window.applyPublicSettings?.(settings);
  if (settings.appName) document.querySelector('.brand>span:last-child').childNodes[0].nodeValue = settings.appName;
}
document.addEventListener('DOMContentLoaded', async () => {
  const user = activeUser();
  const profile = user?.isAdmin ? { is_admin: true } : await window.cloudProfile?.();
  if (!profile?.is_admin) return;
  document.querySelector('.sidebar nav').insertAdjacentHTML('beforeend', '<button class="nav-link" data-view="admin"><span>◉</span> Administração</button>');
  document.querySelector('main').insertAdjacentHTML('beforeend', `<section id="admin" class="view"><div class="settings-wrap"><p class="eyebrow">CONTROLE DO SISTEMA</p><h2>Painel administrativo</h2><div class="admin-hero"><div><small>ACESSO DE ADMINISTRADOR</small><h3>Personalize a experiência do Kitsune.</h3><p>As alterações ficam disponíveis para todos quando o banco estiver conectado.</p></div><span>✦</span></div><form id="adminForm" class="admin-form"><label>Nome do sistema<input id="adminAppName" maxlength="30"></label><label>Mensagem de boas-vindas<input id="adminWelcome" maxlength="100"></label><label>Cor principal<input id="adminAccent" type="color"></label><label>Categorias padrão (separadas por vírgula)<textarea id="adminCategories" rows="4"></textarea></label><button class="primary">Salvar personalização</button><p class="error" id="adminError"></p></form></div></section>`);
  let settings = await window.cloudSettings?.();
  if (!settings) { try { settings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY)); } catch {} }
  settings ||= {};
  document.querySelector('#adminAppName').value = settings.appName || 'Kitsune';
  document.querySelector('#adminWelcome').value = settings.welcome || 'Continue de onde parou.';
  document.querySelector('#adminAccent').value = settings.accent || '#ff7152';
  document.querySelector('#adminCategories').value = (settings.categories || defaults).join(', ');
  applySettings(settings);
  document.querySelector('#adminForm').addEventListener('submit', async event => {
    event.preventDefault();
    const next = { appName: document.querySelector('#adminAppName').value.trim() || 'Kitsune', welcome: document.querySelector('#adminWelcome').value.trim(), accent: document.querySelector('#adminAccent').value, categories: document.querySelector('#adminCategories').value.split(',').map(x => x.trim()).filter(Boolean) };
    try { if (await window.cloudReady) await window.saveCloudSettings(next); else localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next)); applySettings(next); document.querySelector('#adminError').textContent = 'Personalização salva com sucesso.'; }
    catch (error) { localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next)); applySettings(next); document.querySelector('#adminError').textContent = 'Salvo localmente; conecte o banco para publicar para todos.'; }
  });
});
