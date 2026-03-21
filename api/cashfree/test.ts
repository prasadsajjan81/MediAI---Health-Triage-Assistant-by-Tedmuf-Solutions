import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const envVar = process.env.CASHFREE_ENV || 'PRODUCTION';

  if (!appId || !secretKey || appId === 'your_cashfree_app_id_here') {
    return res.status(500).json({
      error: 'Cashfree credentials not configured',
      fix: 'Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables.'
    });
  }

  const configuredAsProduction = envVar === 'PRODUCTION';

  try {
    const { Cashfree, CFEnvironment } = await import('cashfree-pg');

    // v5 SDK: set static properties THEN instantiate
    Cashfree.XClientId = appId;
    Cashfree.XClientSecret = secretKey;
    Cashfree.XEnvironment = configuredAsProduction
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

    const cashfree = new Cashfree();

    const response = await cashfree.PGCreateOrder('2023-08-01', {
      order_amount: 1.00,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'test_verification',
        customer_phone: '9999999999',
        customer_email: 'test@example.com',
        customer_name: 'Verification Test',
      },
      order_meta: {
        return_url: `${req.headers.origin || 'https://vishwasini.com'}/payment-status?order_id={order_id}`,
      },
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Cashfree is working correctly',
      order_id: response.data?.order_id,
      environment: envVar,
    });

  } catch (error: any) {
    const cfError = error.response?.data;
    let fix = null;
    if (cfError?.type === 'authentication_error') {
      fix = `Authentication failed. Your keys and CASHFREE_ENV must match the SAME mode. Current CASHFREE_ENV="${envVar}". Go to your Cashfree dashboard, ensure you are in ${configuredAsProduction ? 'Production' : 'Sandbox'} mode, and copy the correct App ID + Secret Key from there.`;
    }
    return res.status(500).json({
      status: 'ERROR',
      error: error.message,
      cashfree_error: cfError,
      fix,
      debug: { appIdPrefix: appId.substring(0, 6), envUsed: envVar }
    });
  }
}
