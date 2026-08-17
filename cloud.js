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
  const { data } = await client.from('profiles').select('full_name,is_admin').eq('id', user.id).maybeSingle();
  return data;
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
