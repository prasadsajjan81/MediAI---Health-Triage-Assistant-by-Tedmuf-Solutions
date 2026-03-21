import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET for testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const CFModule = await import("cashfree-pg");
    const Cashfree = CFModule.Cashfree || (CFModule as any).default?.Cashfree;
    const CFEnvironment = CFModule.CFEnvironment || (CFModule as any).default?.CFEnvironment;

    if (!Cashfree || !CFEnvironment) {
      return res.status(500).json({
        error: "Cashfree SDK failed to load properly",
        moduleKeys: Object.keys(CFModule)
      });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    if (!appId || !secretKey) {
      return res.status(500).json({ error: "Cashfree credentials not configured" });
    }
    
    // Initialize
    Cashfree.XClientId = appId;
    Cashfree.XClientSecret = secretKey;
    Cashfree.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
      ? CFEnvironment.PRODUCTION 
      : CFEnvironment.SANDBOX;

    const request = {
      order_amount: 1.00,
      order_currency: "INR",
      customer_details: {
        customer_id: "test_user_verification",
        customer_phone: "9999999999",
        customer_email: "test@example.com",
        customer_name: "Verification Test"
      },
      order_meta: {
        return_url: `${req.headers.origin || 'https://vishwasini.com'}/payment-status?order_id={order_id}`
      }
    };

    const response = await Cashfree.PGCreateOrder("2023-08-01", request);
    
    return res.status(200).json({ 
      status: "SUCCESS",
      order_id: response.data?.order_id,
      environment: process.env.CASHFREE_ENV || "SANDBOX (Default)"
    });
  } catch (error: any) {
    return res.status(500).json({ 
      status: "ERROR",
      error: error.message,
      stack: error.stack,
      details: error.response?.data
    });
  }
}
