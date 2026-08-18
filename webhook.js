// Recebe as notificações do Mercado Pago (formato novo e o antigo IPN), confirma o
// pagamento na API do Mercado Pago e ativa a assinatura VIP no Supabase usando a
// chave service_role — que só existe aqui no servidor e nunca é exposta ao navegador.

async function fetchPayment(paymentId, accessToken) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function activateSubscription(userId, paymentId) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) { console.error('SUPABASE_SERVICE_ROLE_KEY não configurada.'); return; }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const res = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId,
      status: 'active',
      provider: 'mercadopago',
      external_reference: userId,
      last_payment_id: String(paymentId),
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) console.error('Falha ao ativar assinatura VIP:', await res.text());
}

export default async function handler(request, response) {
  // Mercado Pago espera um 200 rápido; sempre respondemos OK e processamos o que for possível.
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const paymentId =
      request.query?.['data.id'] ||
      request.body?.data?.id ||
      (request.query?.topic === 'payment' ? request.query?.id : null);
    const type = request.query?.type || request.body?.type || request.query?.topic;

    if (accessToken && paymentId && type === 'payment') {
      const payment = await fetchPayment(paymentId, accessToken);
      if (payment && payment.status === 'approved' && payment.external_reference) {
        await activateSubscription(payment.external_reference, paymentId);
      }
    }
  } catch (error) {
    console.error('Erro no webhook do Mercado Pago:', error);
  }
  return response.status(200).json({ received: true });
}
