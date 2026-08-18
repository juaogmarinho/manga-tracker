const LOCAL_SETTINGS_KEY = 'kitsune-local-settings';
const LOCAL_VIP_CATALOG_KEY = 'kitsune-local-vip-catalog';
function applySettings(settings) {
  window.applyPublicSettings?.(settings);
  if (settings.appName) document.querySelector('.brand>span:last-child').childNodes[0].nodeValue = settings.appName;
}
async function renderVipManageList() {
  const list = document.querySelector('#vipManageList');
  if (!list) return;
  const client = await window.cloudReady;
  let catalog = client ? (await window.cloudVipCatalog()) || [] : (JSON.parse(localStorage.getItem(LOCAL_VIP_CATALOG_KEY) || '[]'));
  list.innerHTML = catalog.length
    ? catalog.map(m => `<span class="manage-category">${(m.title || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))} <button type="button" data-vip-id="${m.id}">×</button></span>`).join('')
    : '<p class="storage-note">Nenhum mangá cadastrado ainda.</p>';
}
document.addEventListener('DOMContentLoaded', async () => {
  const user = activeUser();
  const profile = user?.isAdmin ? { is_admin: true } : await window.cloudProfile?.();
  if (!profile?.is_admin) return;
  document.querySelector('.sidebar nav').insertAdjacentHTML('beforeend', '<button class="nav-link" data-view="admin"><span>◉</span> Administração</button>');
  document.querySelector('main').insertAdjacentHTML('beforeend', `<section id="admin" class="view"><div class="settings-wrap"><p class="eyebrow">CONTROLE DO SISTEMA</p><h2>Painel administrativo</h2><div class="admin-hero"><div><small>ACESSO DE ADMINISTRADOR</small><h3>Personalize a experiência do Kitsune.</h3><p>As alterações ficam disponíveis para todos quando o banco estiver conectado.</p></div><span>✦</span></div><form id="adminForm" class="admin-form"><label>Nome do sistema<input id="adminAppName" maxlength="30"></label><label>Mensagem de boas-vindas<input id="adminWelcome" maxlength="100"></label><label>Cor principal<input id="adminAccent" type="color"></label><label>Nome da área VIP<input id="adminVipTitle" maxlength="40"></label><label>Resumo da área VIP<textarea id="adminVipSubtitle" rows="2" maxlength="120"></textarea></label><label>Cor da área VIP<input id="adminVipAccent" type="color"></label><label>Texto do botão VIP<input id="adminVipCta" maxlength="40"></label><label>Categorias padrão (separadas por vírgula)<textarea id="adminCategories" rows="4"></textarea></label><button class="primary">Salvar personalização</button><p class="error" id="adminError"></p></form><div class="admin-hero" style="margin-top:26px"><div><small>ÁREA VIP · TESTE GRÁTIS (EM DESENVOLVIMENTO)</small><h3>Catálogo de mangás exclusivos.</h3><p>Cadastre os mangás que os usuários com teste grátis do VIP podem acessar. A cobrança de R$ 3,00 fica pronta em <code>vip.js</code> para ser ligada quando o desenvolvimento terminar.</p></div><span>狐</span></div><div id="vipManageList" class="manage-list"></div><form id="vipMangaForm" class="admin-form"><label>Título*<input id="vipTitle" required maxlength="80"></label><label>Capa (URL da imagem)<input id="vipCover" type="url" placeholder="https://..."></label><label>Descrição<textarea id="vipDescription" rows="2" maxlength="300"></textarea></label><label>Link de leitura*<input id="vipReadUrl" type="url" required placeholder="https://..."></label><button class="primary">Adicionar mangá VIP</button><p class="error" id="vipError"></p></form></div></section>`);
  let settings = await window.cloudSettings?.();
  if (!settings) { try { settings = JSON.parse(localStorage.getItem(LOCAL_SETTINGS_KEY)); } catch {} }
  settings ||= {};
  document.querySelector('#adminAppName').value = settings.appName || 'Kitsune';
  document.querySelector('#adminWelcome').value = settings.welcome || 'Continue de onde parou.';
  document.querySelector('#adminAccent').value = settings.accent || '#ff7152';
  document.querySelector('#adminVipTitle').value = settings.vipTitle || 'Área VIP';
  document.querySelector('#adminVipSubtitle').value = settings.vipSubtitle || 'Mangás premium, edições exclusivas e leitura sem interrupções.';
  document.querySelector('#adminVipAccent').value = settings.vipAccent || '#f4c96c';
  document.querySelector('#adminVipCta').value = settings.vipCta || 'Ativar teste grátis';
  document.querySelector('#adminCategories').value = (settings.categories || defaults).join(', ');
  applySettings(settings);
  document.querySelector('#adminForm').addEventListener('submit', async event => {
    event.preventDefault();
    const next = {
      appName: document.querySelector('#adminAppName').value.trim() || 'Kitsune',
      welcome: document.querySelector('#adminWelcome').value.trim(),
      accent: document.querySelector('#adminAccent').value,
      vipTitle: document.querySelector('#adminVipTitle').value.trim() || 'Área VIP',
      vipSubtitle: document.querySelector('#adminVipSubtitle').value.trim() || 'Mangás premium, edições exclusivas e leitura sem interrupções.',
      vipAccent: document.querySelector('#adminVipAccent').value,
      vipCta: document.querySelector('#adminVipCta').value.trim() || 'Ativar teste grátis',
      categories: document.querySelector('#adminCategories').value.split(',').map(x => x.trim()).filter(Boolean)
    };
    try { if (await window.cloudReady) await window.saveCloudSettings(next); else localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next)); applySettings(next); document.querySelector('#adminError').textContent = 'Personalização salva com sucesso.'; }
    catch (error) { localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next)); applySettings(next); document.querySelector('#adminError').textContent = 'Salvo localmente; conecte o banco para publicar para todos.'; }
  });
  await renderVipManageList();
  document.querySelector('#vipMangaForm').addEventListener('submit', async event => {
    event.preventDefault();
    const errorEl = document.querySelector('#vipError');
    const manga = { title: document.querySelector('#vipTitle').value.trim(), cover: document.querySelector('#vipCover').value.trim(), description: document.querySelector('#vipDescription').value.trim(), read_url: document.querySelector('#vipReadUrl').value.trim() };
    if (!manga.title || !manga.read_url) { errorEl.textContent = 'Preencha ao menos o título e o link de leitura.'; return; }
    const client = await window.cloudReady;
    try {
      if (client) { await window.cloudVipAddManga(manga); }
      else { const list = JSON.parse(localStorage.getItem(LOCAL_VIP_CATALOG_KEY) || '[]'); list.unshift({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...manga }); localStorage.setItem(LOCAL_VIP_CATALOG_KEY, JSON.stringify(list)); }
      errorEl.textContent = ''; event.target.reset(); await renderVipManageList();
    } catch (error) { errorEl.textContent = 'Não foi possível salvar: ' + error.message; }
  });
  document.querySelector('#vipManageList').addEventListener('click', async event => {
    const btn = event.target.closest('[data-vip-id]');
    if (!btn) return;
    if (!confirm('Remover este mangá do catálogo VIP?')) return;
    const client = await window.cloudReady;
    if (client) { await window.cloudVipDeleteManga(btn.dataset.vipId); }
    else { const list = (JSON.parse(localStorage.getItem(LOCAL_VIP_CATALOG_KEY) || '[]')).filter(m => m.id !== btn.dataset.vipId); localStorage.setItem(LOCAL_VIP_CATALOG_KEY, JSON.stringify(list)); }
    await renderVipManageList();
  });
});
