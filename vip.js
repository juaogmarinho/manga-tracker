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

async function renderVipPage() {
  const wrap = document.querySelector('#vipContent');
  if (!wrap) return;
  const client = await window.cloudReady;
  const status = await loadVipStatus();

  if (!status.active) {
    const trialMode = VIP_MODE === 'trial';
    wrap.innerHTML = `
      <div class="vip-pitch">
        <span class="vip-badge">✦ VIP ${trialMode ? '· Teste grátis' : ''}</span>
        <h2>Desbloqueie o acervo de mangás exclusivos</h2>
        <p>${trialMode
          ? `A Área VIP está em desenvolvimento — por enquanto, ative um teste grátis de ${VIP_TRIAL_DAYS} dias e explore o acervo sem pagar nada.`
          : 'Assinantes VIP têm acesso aos mangás já disponíveis no site por apenas <b>R$ 3,00</b>.'}</p>
        <button class="primary" id="vipSubscribeBtn">${trialMode ? `Ativar teste grátis · ${VIP_TRIAL_DAYS} dias` : 'Assinar VIP · R$ 3,00'} <b>→</b></button>
        <p class="vip-note" id="vipNote"></p>
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
    <div class="vip-active-banner"><span class="vip-badge">✦ VIP ativo${VIP_MODE === 'trial' ? ' · Teste grátis' : ''}</span>${status.expiresAt ? `<small>${VIP_MODE === 'trial' ? 'Teste expira em' : 'Renova em'} ${new Intl.DateTimeFormat('pt-BR').format(new Date(status.expiresAt))}</small>` : ''}</div>
    <div class="vip-grid">${catalog.length ? catalog.map(vipMangaCard).join('') : '<div class="empty">Nenhum mangá disponível no catálogo VIP ainda. Volte em breve!</div>'}</div>`;
}

function insertVipUI() {
  if (document.querySelector('#vip')) return;
  document.querySelector('.sidebar nav')?.insertAdjacentHTML(
    'beforeend',
    '<button class="nav-link" data-view="vip"><span>✦</span> VIP</button>'
  );
  document.querySelector('main')?.insertAdjacentHTML(
    'beforeend',
    `<section id="vip" class="view"><div class="settings-wrap"><p class="eyebrow">CONTEÚDO EXCLUSIVO</p><h2>Área VIP</h2><div id="vipContent"></div></div></section>`
  );
}

function handleVipReturn() {
  const params = new URLSearchParams(location.search);
  const state = params.get('vip');
  if (!state) return;
  const toastEl = document.querySelector('#toast');
  const messages = {
    success: 'Pagamento aprovado! Confirmando sua assinatura VIP...',
    pending: 'Pagamento em processamento. Assim que for aprovado, seu acesso VIP será liberado.',
    failure: 'O pagamento não foi concluído. Você pode tentar novamente na área VIP.',
  };
  if (toastEl && messages[state]) {
    toastEl.textContent = messages[state];
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4000);
  }
  history.replaceState(null, '', location.pathname);
  document.querySelector('[data-view="vip"]')?.click();
  if (state === 'success') {
    let tries = 0;
    const poll = setInterval(async () => {
      tries++;
      const status = await loadVipStatus();
      if (status.active || tries >= 6) { clearInterval(poll); renderVipPage(); }
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!activeUser()) return;
  insertVipUI();
  await renderVipPage();
  handleVipReturn();
});
