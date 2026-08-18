window.supabaseClient = null;

async function readJsonResponse(response, fallbackError) {
  if (response.status === 404) {
    throw new Error('A área VIP não está configurada neste ambiente.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (!text || text.trim().length === 0) throw new Error(fallbackError);
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length > 180) throw new Error(fallbackError);
    throw new Error(cleanText.includes('The page could not be found') || cleanText.includes('NOT_FOUND')
      ? 'A rota VIP não foi encontrada no servidor. O modo local da área VIP será usado.'
      : cleanText);
  }

  return response.json();
}

window.cloudReady = (async () => {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return null;
    const config = await readJsonResponse(response, 'Supabase não configurado');
    if (!config.configured) throw new Error('Supabase não configurado');
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    return window.supabaseClient;
  } catch (error) {
    console.info('Modo local: configure o Supabase para sincronizar.');
    return null;
  }
})();

window.cloudSave = async data => {
  const client = await window.cloudReady;
  const user = activeUser();
  if (!client || !user) return;
  const { error } = await client.from('libraries').upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
  if (error) console.error('Não foi possível sincronizar a biblioteca.', error.message);
};

window.cloudLoad = async () => {
  const client = await window.cloudReady;
  const user = activeUser();
  if (!client || !user) return null;
  const { data, error } = await client.from('libraries').select('data').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data?.data || null;
};

window.cloudProfile = async () => {
  const client = await window.cloudReady;
  const user = activeUser();
  if (!client || !user) return null;
  const { data } = await client.from('profiles').select('full_name,is_admin,avatar_url').eq('id', user.id).maybeSingle();
  return data;
};

window.cloudSaveProfile = async patch => {
  const client = await window.cloudReady;
  const user = activeUser();
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

window.cloudVipStatus = async () => {
  const client = await window.cloudReady;
  const user = activeUser();
  if (!client || !user) return null;
  const { data, error } = await client.from('subscriptions').select('status,expires_at').eq('user_id', user.id).maybeSingle();
  if (error) {
    console.warn('Não foi possível verificar a assinatura VIP.', error.message);
    return null;
  }
  if (!data) return { active: false };
  const active = data.status === 'active' && (!data.expires_at || new Date(data.expires_at) > new Date());
  return { active, expiresAt: data.expires_at };
};

window.cloudVipCatalog = async () => {
  const client = await window.cloudReady;
  if (!client) return null;
  const { data, error } = await client.from('vip_manga').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('Não foi possível carregar o catálogo VIP.', error.message);
    return [];
  }
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

  try {
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email, name: user.name })
    });

    const data = await readJsonResponse(response, 'Não foi possível iniciar o pagamento.');
    if (!response.ok || !data.init_point) {
      throw new Error(data.error || 'Não foi possível iniciar o pagamento.');
    }
    return data.init_point;
  } catch (error) {
    const message = String(error?.message || '');
    if (/rota|configurada|não foi encontrada|NOT_FOUND/i.test(message)) {
      throw new Error('Esse recurso de pagamento não está habilitado neste ambiente. O VIP local continua disponível no navegador.');
    }
    throw error;
  }
};

window.activateVipTrial = async () => {
  const client = await window.cloudReady;
  if (!client) throw new Error('Banco indisponível.');

  const { data } = await client.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Saia e entre novamente.');

  try {
    const response = await fetch('/api/vip/activate-trial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const result = await readJsonResponse(response, 'Não foi possível ativar o teste grátis.');
    if (!response.ok) {
      throw new Error(result.error || 'Não foi possível ativar o teste grátis.');
    }
    return result;
  } catch (error) {
    const message = String(error?.message || '');
    if (/rota|configurada|não foi encontrada|NOT_FOUND/i.test(message)) {
      throw new Error('A rota do teste VIP não está disponível neste ambiente. Você pode continuar usando o modo local do VIP.');
    }
    throw error;
  }
};
