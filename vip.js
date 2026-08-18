// Enquanto a Área VIP está em desenvolvimento, o acesso é liberado como teste grátis,
// sem cobrança. Para religar o pagamento via Mercado Pago mais tarde, basta trocar
// VIP_MODE para 'paid' — todo o fluxo de checkout já está pronto em cloud.js.
const VIP_MODE = 'trial'; // 'trial' | 'paid'
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
  if (client) return (await window.cloudVipStatus()) || { active: false };
  const user = activeUser();
  if (user && localStorage.getItem(VIP_LOCAL_KEY + ':' + user.id) === '1') return { active: true };
  return { active: false };
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
  const vipCta = settings.vipCta || (VIP_MODE === 'trial' ? `Ativar teste grátis · ${VIP_TRIAL_DAYS} dias` : 'Assinar VIP · R$ 3,00');
  const vipAccent = settings.vipAccent || '#f4c96c';

  if (!status.active) {
    const trialMode = VIP_MODE === 'trial';
    const summaryText = trialMode
      ? `A Área VIP está em desenvolvimento — por enquanto, ative um teste grátis de ${VIP_TRIAL_DAYS} dias e explore o acervo sem pagar nada.`
      : 'Assinantes VIP têm acesso aos mangás já disponíveis no site por apenas <b>R$ 3,00</b>.';

    wrap.innerHTML = `
      <div class="vip-shell">
        <div class="vip-hero" style="--vip-accent:${vipAccent};">
          <div class="vip-hero-copy">
            <span class="vip-badge">✦ VIP ${trialMode ? '· Teste grátis' : ''}</span>
            <h2>${vipTitle}</h2>
            <p>${vipSubtitle}</p>
            <ul class="vip-feature-list">
              <li>Catálogo premium selecionado</li>
              <li>Acesso antecipado a lançamentos</li>
              <li>Leitura sem distrações</li>
            </ul>
            <div class="vip-actions">
              <button class="primary" id="vipSubscribeBtn">${vipCta} <b>→</b></button>
            </div>
            <p class="vip-note" id="vipNote"></p>
          </div>
          <div class="vip-preview-card">
            <div class="vip-preview-top"><span>Premium</span><strong>${trialMode ? 'Teste grátis' : 'Assinatura'}</strong></div>
            <div class="vip-price-tag">${trialMode ? `${VIP_TRIAL_DAYS} dias` : 'R$ 3,00'}</div>
            <p>${summaryText}</p>
            <div class="vip-mini-stats">
              <span>+120 títulos</span>
              <span>Atualizações</span>
            </div>
          </div>
        </div>
      </div>`;
    const note = document.querySelector('#vipNote');
    const btn = document.querySelector('#vipSubscribeBtn');
    const originalLabel = btn.innerHTML;

    if (!client) note.textContent = trialMode
      ? 'Modo local: o teste grátis fica salvo apenas neste navegador.'
      : 'Pagamentos exigem o banco de dados e o Mercado Pago configurados (veja o README).';

    btn.addEventListener('click', async () => {
      if (trialMode) {
        btn.disabled = true; btn.textContent = 'Ativando...';
        try {
          if (client) {
            await window.activateVipTrial();
          } else {
            const user = activeUser();
            localStorage.setItem(VIP_LOCAL_KEY + ':' + user.id, '1');
          }
          note.textContent = '';
          await renderVipPage();
        } catch (error) {
          note.textContent = error.message;
          btn.disabled = false; btn.innerHTML = originalLabel;
        }
        return;
      }
      if (!client) { note.textContent = 'Pagamentos exigem o banco de dados e o Mercado Pago configurados (veja o README).'; return; }
      btn.disabled = true; btn.textContent = 'Redirecionando...';
      try {
        const url = await window.createVipCheckout();
        location.href = url;
      } catch (error) {
        note.textContent = error.message;
        btn.disabled = false; btn.innerHTML = originalLabel;
      }
    });
    return;
  }

  const catalog = await loadVipCatalog();
  wrap.innerHTML = `
    <div class="vip-shell vip-shell--active">
      <div class="vip-hero vip-hero--active" style="--vip-accent:${vipAccent};">
        <div class="vip-hero-copy">
          <span class="vip-badge">✦ VIP ativo${VIP_MODE === 'trial' ? ' · Teste grátis' : ''}</span>
          <h2>${vipTitle}</h2>
          <p>${vipSubtitle}</p>
          <div class="vip-status-row">
            <span class="vip-pill">${VIP_MODE === 'trial' ? 'Teste em andamento' : 'Assinatura ativa'}</span>
            ${status.expiresAt ? `<small>${VIP_MODE === 'trial' ? 'Expira em' : 'Renova em'} ${new Intl.DateTimeFormat('pt-BR').format(new Date(status.expiresAt))}</small>` : ''}
          </div>
        </div>
        <div class="vip-preview-card">
          <div class="vip-preview-top"><span>Benefícios</span><strong>VIP</strong></div>
          <div class="vip-price-tag">${VIP_MODE === 'trial' ? '7 dias' : 'R$ 3,00'}</div>
          <p>Seu acervo premium está liberado e atualizado com novas adições.</p>
        </div>
      </div>
      <div class="vip-grid">${catalog.length ? catalog.map(vipMangaCard).join('') : '<div class="empty">Nenhum mangá disponível no catálogo VIP ainda. Volte em breve!</div>'}</div>
    </div>`;
}

function insertVipUI() {
  return;
}

function handleVipReturn() {
  return;
}

document.addEventListener('DOMContentLoaded', () => {
  const vipNav = document.querySelector('.nav-link[data-view="vip"]');
  if (vipNav) vipNav.remove();
  const vipSection = document.querySelector('#vip');
  if (vipSection) vipSection.remove();
});
