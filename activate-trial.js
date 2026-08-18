// Ativa um teste grátis de VIP para o usuário autenticado. Enquanto a Área VIP está em
// desenvolvimento, este endpoint substitui o pagamento — nenhuma cobrança é feita.
// O token de sessão do usuário é validado contra a API de Auth do Supabase antes de
// gravar a assinatura, e a gravação em si usa a chave service_role (somente no servidor).
const TRIAL_DAYS = 7;

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return response.status(503).json({ error: 'Banco não configurado no servidor.' });
  }

  const authHeader = request.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return response.status(401).json({ error: 'Sessão inválida.' });

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) return response.status(401).json({ error: 'Sessão expirada. Entre novamente.' });
    const user = await userRes.json();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TRIAL_DAYS);

    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: user.id,
        status: 'active',
        provider: 'trial',
        external_reference: user.id,
        last_payment_id: null,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
    if (!upsertRes.ok) {
      console.error('Falha ao ativar teste grátis:', await upsertRes.text());
      return response.status(502).json({ error: 'Não foi possível ativar o teste grátis.' });
    }

    return response.status(200).json({ active: true, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Erro ao ativar teste grátis:', error);
    return response.status(500).json({ error: 'Erro no servidor ao ativar o teste grátis.' });
  }
}


