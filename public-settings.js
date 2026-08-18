window.applyPublicSettings = settings => {
  if (!settings) return;

  // Aplicar nome do app
  if (settings.appName) {
    document.querySelectorAll('.brand>span:last-child').forEach(node => {
      if (node.childNodes[0]) {
        node.childNodes[0].nodeValue = settings.appName;
      }
    });
  }

  // Aplicar marca do logo
  if (settings.logoMark) {
    document.querySelectorAll('.brand-mark').forEach(el => {
      el.textContent = settings.logoMark;
    });
  }

  // Aplicar cor principal
  if (settings.accent) {
    document.documentElement.style.setProperty('--accent', settings.accent);
  }

  // Aplicar personalização da área VIP
  if (settings.vipAccent) {
    document.documentElement.style.setProperty('--vip-accent', settings.vipAccent);
  }

  // Aplicar mensagem de boas-vindas
  if (settings.welcome) {
    const heroH2 = document.querySelector('.hero h2');
    if (heroH2) {
      heroH2.innerHTML = settings.welcome.replace(/\n/g, '<br>');
    }
  }

  // Aplicar mensagem de rodapé
  if (settings.footer) {
    const sidebarBottom = document.querySelector('.sidebar-bottom p');
    if (sidebarBottom) {
      sidebarBottom.textContent = settings.footer;
    }
  }

  // Aplicar border-radius
  if (settings.borderRadius) {
    document.documentElement.style.setProperty('--border-radius-base', settings.borderRadius + 'px');
  }

  // Aplicar categorias padrão definidas pelo administrador
  if (settings.categories && window.mergeGlobalCategories) {
    window.mergeGlobalCategories(settings.categories);
  }

  // Aplicar preferências de animação
  if (settings.animations) {
    if (settings.animations === 'reduced') {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    } else if (settings.animations === 'disabled') {
      document.documentElement.style.setProperty('animation', 'none !important');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('animation');
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  window.applyPublicSettings(await window.cloudSettings?.());
});