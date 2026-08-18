// Enquanto a Área VIP está em desenvolvimento, o acesso é liberado como teste grátis,
// sem cobrança. Para religar o pagamento via Mercado Pago mais tarde, basta trocar
// VIP_MODE para 'paid' — todo o fluxo de checkout já está pronto em cloud.js.
const VIP_MODE = 'free'; // 'free' | 'trial' | 'paid'
const VIP_TRIAL_DAYS = 7;
const VIP_LOCAL_KEY = 'kitsune-local-vip-status';
const VIP_LOCAL_CATALOG_KEY = 'kitsune-local-vip-catalog';

function vipMangaCard(m) {
  const cover = m.cover ? `style="background-image:url('${String(m.cover).replace(/'/g, '%27')}')"` : '';
  const desc = m.description ? `<p>${String(m.description).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>` : '';
  return `<article class="vip-card"><div class="vip-cover" ${cover}>${m.cover ? '' : '狐'}</div><div class="vip-body"><h3>${String(m.title || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</h3>${desc}<a class="secondary" target="_blank" rel="noopener" href="${m.read_url}">📖 Ler agora</a></div></article>`;
}

async function loadVipCatalog() {
  const client = await window.cloudReady;
  if (client) return (await window.cloudVipCatalog()) || [];
  try { return JSON.parse(localStorage.getItem(VIP_LOCAL_CATALOG_KEY)) || []; } catch { return []; }
}

async function loadVipStatus() {
  const client = await window.cloudReady;
  if (client) return (await window.cloudVipStatus()) || { active: true };
  const user = activeUser();
  if (user && localStorage.getItem(VIP_LOCAL_KEY + ':' + user.id) === '1') return { active: true };
  return { active: true };
}

async function getVipSettings() {
  try {
    const settings = await window.cloudSettings?.();
    if (settings) return settings;
  } catch {}

  try {
    return JSON.parse(localStorage.getItem('kitsune-local-settings') || '{}');
  } catch {
    return {};
  }
}

async function renderVipPage() {
  const wrap = document.querySelector('#vipContent');
  if (!wrap) return;
  const client = await window.cloudReady;
  const status = await loadVipStatus();
  const settings = await getVipSettings();
  const vipTitle = settings.vipTitle || 'Área VIP';
  const vipSubtitle = settings.vipSubtitle || 'Mangás premium, edições exclusivas e leitura sem interrupções.';
  const vipAccent = settings.vipAccent || '#f4c96c';

  const isFreeMode = VIP_MODE === 'free';
  const catalog = await loadVipCatalog();

  wrap.innerHTML = `
    <div class="vip-shell vip-shell--active">
      <div class="vip-hero vip-hero--active" style="--vip-accent:${vipAccent};">
        <div class="vip-hero-copy">
          <div class="vip-hero-meta">
            <span class="vip-badge">✦ ${isFreeMode ? 'VIP livre para todos' : 'VIP ativo'}</span>
            <span class="vip-badge vip-badge--ghost">${isFreeMode ? 'Acesso irrestrito' : 'Premium'}</span>
          </div>
          <h2>${vipTitle}</h2>
          <p>${vipSubtitle}</p>
          <div class="vip-status-row">
            <span class="vip-pill">${isFreeMode ? 'Acesso livre' : (VIP_MODE === 'trial' ? 'Teste em andamento' : 'Assinatura ativa')}</span>
            <span class="vip-pill vip-pill--soft">${isFreeMode ? '+120 títulos' : 'Atualizações mensais'}</span>
            ${status.expiresAt ? `<small>${VIP_MODE === 'trial' ? 'Expira em' : 'Renova em'} ${new Intl.DateTimeFormat('pt-BR').format(new Date(status.expiresAt))}</small>` : ''}
          </div>
          <div class="vip-actions">
            <button class="primary" id="vipBrowseBtn">Explorar catálogo <b>→</b></button>
            <button class="secondary" id="vipBenefitsBtn" type="button">Ver benefícios</button>
          </div>
        </div>
        <div class="vip-preview-card">
          <div class="vip-preview-top"><span>Benefícios</span><strong>VIP</strong></div>
          <div class="vip-price-tag">${isFreeMode ? 'Livre' : (VIP_MODE === 'trial' ? '7 dias' : 'R$ 3,00')}</div>
          <p>${isFreeMode ? 'Todos podem explorar o acervo da área VIP sem bloqueios ou pagamento.' : 'Seu acervo premium está liberado e atualizado com novas adições.'}</p>
          <div class="vip-mini-stats">
            <span>+120 títulos</span>
            <span>Atualizações</span>
          </div>
        </div>
      </div>

      <div class="vip-feature-strip">
        <div class="vip-feature-item">
          <span>✦</span>
          <div>
            <strong>Leitura sem distrações</strong>
            <small>Catalogo focado e livre</small>
          </div>
        </div>
        <div class="vip-feature-item">
          <span>◎</span>
          <div>
            <strong>Lançamentos em destaque</strong>
            <small>Atualizações prioritárias</small>
          </div>
        </div>
        <div class="vip-feature-item">
          <span>▣</span>
          <div>
            <strong>Curadoria premium</strong>
            <small>Títulos selecionados</small>
          </div>
        </div>
      </div>

      <div class="vip-grid">${catalog.length ? catalog.map(vipMangaCard).join('') : '<div class="empty">Nenhum mangá disponível no catálogo VIP ainda. Volte em breve!</div>'}</div>
    </div>`;

  const browseBtn = document.getElementById('vipBrowseBtn');
  const benefitsBtn = document.getElementById('vipBenefitsBtn');
  if (browseBtn) browseBtn.addEventListener('click', () => {
    const grid = document.querySelector('.vip-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  if (benefitsBtn) benefitsBtn.addEventListener('click', () => {
    const strip = document.querySelector('.vip-feature-strip');
    if (strip) strip.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (client && !isFreeMode) {
    const note = document.querySelector('#vipNote');
    if (note) note.textContent = 'Modo local: o teste grátis fica salvo apenas neste navegador.';
  }
}

function insertVipUI() {
  return;
}

function handleVipReturn() {
  return;
}

function insertVipUI() {
  const nav = document.querySelector('.nav-link[data-view="vip"]');
  if (!nav) {
    const navList = document.querySelector('.sidebar nav');
    if (navList) {
      navList.insertAdjacentHTML('beforeend', '<button class="nav-link" data-view="vip"><span>✦</span> Área VIP</button>');
    }
  }

  const vipSection = document.querySelector('#vip');
  if (!vipSection) {
    const main = document.querySelector('main');
    if (main) {
      main.insertAdjacentHTML('beforeend', '<section id="vip" class="view"><div id="vipContent"></div></section>');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  insertVipUI();
  await renderVipPage();
});
