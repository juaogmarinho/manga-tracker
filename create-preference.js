export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return response.status(503).json({ error: 'Mercado Pago não configurado no servidor.' });

  const { userId, email, name } = request.body || {};
  if (!userId || !email) return response.status(400).json({ error: 'Usuário inválido.' });

  const proto = request.headers['x-forwarded-proto'] || 'https';
  const site = `${proto}://${request.headers.host}`;

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: 'kitsune-vip',
            title: 'Kitsune Tracker — Assinatura VIP (mangás exclusivos)',
            description: 'Acesso ao catálogo de mangás exclusivos por 30 dias',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 3.0,
          },
        ],
        payer: { email, name: name || undefined },
        external_reference: userId,
        back_urls: {
          success: `${site}/?vip=success`,
          pending: `${site}/?vip=pending`,
          failure: `${site}/?vip=failure`,
        },
        auto_return: 'approved',
        notification_url: `${site}/api/mercadopago/webhook`,
        statement_descriptor: 'KITSUNE VIP',
      }),
    });

    const data = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error('Mercado Pago create-preference error:', data);
      return response.status(502).json({ error: 'Não foi possível criar o pagamento.' });
    }

    return response.status(200).json({ init_point: data.init_point, preference_id: data.id });
  } catch (error) {
    console.error('Mercado Pago create-preference exception:', error);
    return response.status(500).json({ error: 'Erro ao comunicar com o Mercado Pago.' });
  }
}


