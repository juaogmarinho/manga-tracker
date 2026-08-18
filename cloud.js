window.supabaseClient = null;
window.cloudReady = (async () => {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (!config.configured) throw new Error('Supabase não configurado');
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    return window.supabaseClient;
  } catch (error) { console.info('Modo local: configure o Supabase para sincronizar.'); return null; }
})();
window.cloudSave = async data => {
  const client = await window.cloudReady, user = activeUser();
  if (!client || !user) return;
  const { error } = await client.from('libraries').upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
  if (error) console.error('Não foi possível sincronizar a biblioteca.', error.message);
};
window.cloudLoad = async () => {
  const client = await window.cloudReady, user = activeUser();
  if (!client || !user) return null;
  const { data, error } = await client.from('libraries').select('data').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data?.data || null;
};
window.cloudProfile = async () => {
  const client = await window.cloudReady, user = activeUser();
  if (!client || !user) return null;
  const { data } = await client.from('profiles').select('full_name,is_admin,avatar_url').eq('id', user.id).maybeSingle();
  return data;
};
window.cloudSaveProfile = async patch => {
  const client = await window.cloudReady, user = activeUser();
  if (!client || !user) throw new Error('Entre na sua conta para salvar o perfil.');
  const { error } = await client.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
};
window.cloudSettings = async () => {
  const client = await window.cloudReady;
  if (!client) return null;
  const { data } = await client.from('app_settings').select('settings').eq('id', true).maybeSingle();
  return data?.settings || null;
};
window.saveCloudSettings = async settings => {
  const client = await window.cloudReady;
  if (!client) throw new Error('Banco indisponível');
  const { error } = await client.from('app_settings').update({ settings, updated_at: new Date().toISOString() }).eq('id', true);
  if (error) throw error;
};

// ---- VIP: assinatura e catálogo de mangás ----
window.cloudVipStatus = async () => {
  const client = await window.cloudReady, user = activeUser();
  if (!client || !user) return null;
  const { data, error } = await client.from('subscriptions').select('status,expires_at').eq('user_id', user.id).maybeSingle();
  if (error) { console.warn('Não foi possível verificar a assinatura VIP.', error.message); return null; }
  if (!data) return { active: false };
  const active = data.status === 'active' && (!data.expires_at || new Date(data.expires_at) > new Date());
  return { active, expiresAt: data.expires_at };
};
window.cloudVipCatalog = async () => {
  const client = await window.cloudReady;
  if (!client) return null;
  const { data, error } = await client.from('vip_manga').select('*').order('created_at', { ascending: false });
  if (error) { console.warn('Não foi possível carregar o catálogo VIP.', error.message); return []; }
  return data || [];
};
window.cloudVipAddManga = async manga => {
  const client = await window.cloudReady;
  if (!client) throw new Error('Banco indisponível');
  const { error } = await client.from('vip_manga').insert(manga);
  if (error) throw error;
};
window.cloudVipDeleteManga = async id => {
  const client = await window.cloudReady;
  if (!client) throw new Error('Banco indisponível');
  const { error } = await client.from('vip_manga').delete().eq('id', id);
  if (error) throw error;
};
window.createVipCheckout = async () => {
  const user = activeUser();
  if (!user) throw new Error('Entre na sua conta para assinar o VIP.');
  const response = await fetch('/api/mercadopago/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, email: user.email, name: user.name }),
  });
  const data = await response.json();
  if (!response.ok || !data.init_point) throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
  return data.init_point;
};
window.activateVipTrial = async () => {
  const client = await window.cloudReady;
  if (!client) throw new Error('Banco indisponível.');
  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Saia e entre novamente.');
  const response = await fetch('/api/vip/activate-trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível ativar o teste grátis.');
  return result;
};
