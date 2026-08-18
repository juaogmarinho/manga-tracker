const PROFILE_LOCAL_KEY = 'kitsune-local-profile';
let profileAvatarDraft = '';

function profileInitials(name) {
  return (name || 'O').trim()[0]?.toUpperCase() || 'O';
}

async function hydrateProfile() {
  const user = activeUser();
  if (!user) return;
  const client = await window.cloudReady;
  if (client) {
    const profile = await window.cloudProfile?.();
    if (profile) updateCachedUser({ name: profile.full_name || user.name, avatar: profile.avatar_url || null });
  } else {
    try {
      const local = JSON.parse(localStorage.getItem(PROFILE_LOCAL_KEY + ':' + user.id));
      if (local) updateCachedUser({ name: local.name || user.name, avatar: local.avatar || null });
    } catch { /* sem perfil local salvo ainda */ }
  }
}

function renderProfileForm() {
  const user = activeUser();
  if (!user) return;
  document.querySelector('#profileNameInput').value = user.name || '';
  profileAvatarDraft = user.avatar || '';
  paintAvatarPreview(user.name);
}

function paintAvatarPreview(name) {
  const preview = document.querySelector('#profileAvatarPreview');
  if (!preview) return;
  if (profileAvatarDraft) {
    preview.style.backgroundImage = `url('${profileAvatarDraft}')`;
    preview.innerHTML = '';
  } else {
    preview.style.backgroundImage = '';
    preview.innerHTML = `<span>${profileInitials(name)}</span>`;
  }
  document.querySelector('#removeAvatar').hidden = !profileAvatarDraft;
}

function insertProfileUI() {
  const wrap = document.querySelector('#settings .settings-wrap');
  if (!wrap || document.querySelector('#profileCard')) return;
  wrap.insertAdjacentHTML('afterbegin', `<div class="settings-card profile-card" id="profileCard"><div><h3>Meu perfil</h3><p>Personalize sua foto e o nome exibido no Kitsune.</p><form id="profileForm" class="profile-form" novalidate><div class="profile-avatar-upload"><label id="profileAvatarPreview" for="profileAvatarInput"></label><div><input id="profileAvatarInput" type="file" accept="image/*" hidden><button type="button" class="remove-cover" id="removeAvatar" hidden>Remover foto</button></div></div><label>Nome de exibição<input id="profileNameInput" maxlength="40" placeholder="Como podemos chamar você?"></label><p class="error" id="profileError"></p><button class="primary" type="submit">Salvar perfil</button></form></div></div>`);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!activeUser()) return;
  await hydrateProfile();
  insertProfileUI();
  renderProfileForm();

  document.querySelector('#profileAvatarInput').addEventListener('change', event => {
    const file = event.target.files[0];
    const errorEl = document.querySelector('#profileError');
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) { errorEl.textContent = 'Escolha uma imagem de até 2,5 MB.'; return; }
    errorEl.textContent = '';
    const reader = new FileReader();
    reader.onload = () => { profileAvatarDraft = reader.result; paintAvatarPreview(document.querySelector('#profileNameInput').value); };
    reader.readAsDataURL(file);
  });

  document.querySelector('#removeAvatar').addEventListener('click', () => {
    profileAvatarDraft = '';
    paintAvatarPreview(document.querySelector('#profileNameInput').value);
  });

  document.querySelector('#profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const errorEl = document.querySelector('#profileError');
    const name = document.querySelector('#profileNameInput').value.trim();
    if (!name) { errorEl.textContent = 'Informe um nome de exibição.'; return; }
    const client = await window.cloudReady;
    const user = activeUser();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      if (client) {
        await window.cloudSaveProfile({ full_name: name, avatar_url: profileAvatarDraft || null });
      } else {
        localStorage.setItem(PROFILE_LOCAL_KEY + ':' + user.id, JSON.stringify({ name, avatar: profileAvatarDraft }));
      }
      updateCachedUser({ name, avatar: profileAvatarDraft || null });
      errorEl.textContent = '';
      toast('Perfil atualizado!');
    } catch (error) {
      errorEl.textContent = 'Não foi possível salvar: ' + error.message;
    } finally {
      submitBtn.disabled = false;
    }
  });
});
