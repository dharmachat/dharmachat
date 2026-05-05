// Only DharmaChat origins can create Razorpay orders here. Wildcard
// CORS would have let any third-party site spam this endpoint and
// drive up Razorpay request volume / open-orders backlog.
const ALLOWED_ORIGINS = ['https://dharmachat.in', 'https://www.dharmachat.in'];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment not configured' });

  const { amount, currency, receipt, plan, uid } = req.body;

  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency || 'INR',
        receipt: receipt || 'dharmachat_' + Date.now(),
        notes: { plan: plan || 'monthly', uid: uid || '' }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.description || 'Payment order creation failed' });
    }

    const order = await response.json();
    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: keyId });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
