import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const envVar = process.env.CASHFREE_ENV || 'PRODUCTION';

    if (!appId || !secretKey || appId === 'your_cashfree_app_id_here' || appId === 'TEST_APP_ID') {
      return res.status(500).json({
        error: 'Cashfree credentials not configured',
        message: 'Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables.'
      });
    }

    const { Cashfree, CFEnvironment } = await import('cashfree-pg');

    // v5 SDK: static properties first, then instantiate
    Cashfree.XClientId = appId;
    Cashfree.XClientSecret = secretKey;
    Cashfree.XEnvironment = envVar === 'PRODUCTION'
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

    const cashfree = new Cashfree();

    console.log(`Cashfree: AppID ${appId.substring(0, 6)}... | env=${envVar}`);

    const { amount, customerId, customerPhone, customerEmail, customerName } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const response = await cashfree.PGCreateOrder('2023-08-01', {
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId || `cust_${Date.now()}`,
        customer_phone: customerPhone || '9999999999',
        customer_email: customerEmail || 'user@example.com',
        customer_name: customerName || 'User',
      },
      order_meta: {
        return_url: `${req.headers.origin || 'https://vishwasini.com'}/payment-status?order_id={order_id}`,
      },
    });

    if (!response.data?.payment_session_id) {
      return res.status(400).json({
        error: 'Order creation failed — no session ID returned',
        details: response.data
      });
    }

    console.log('Cashfree order created:', response.data.order_id);
    return res.status(200).json(response.data);

  } catch (error: any) {
    const cfError = error.response?.data;
    console.error('Cashfree order error:', cfError || error.message);
    return res.status(500).json({
      error: 'Failed to create Cashfree order',
      details: cfError || error.message
    });
  }
}
