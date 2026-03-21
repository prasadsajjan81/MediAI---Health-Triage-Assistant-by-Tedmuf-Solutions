import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET for testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Cashfree, CFEnvironment } = await import("cashfree-pg");

    const appId = (process.env.CASHFREE_APP_ID || "").trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();

    if (!appId || !secretKey || appId === 'your_cashfree_app_id_here') {
      return res.status(500).json({
        error: "Cashfree credentials not configured",
        message: "Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables.",
        instructions: {
          vercel: "Go to Vercel Dashboard > Settings > Environment Variables and add CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
          local: "Add these variables to your .env file."
        }
      });
    }

    // v5 SDK: set static properties, then instantiate
    Cashfree.XClientId = appId;
    Cashfree.XClientSecret = secretKey;
    
    // Auto-detect environment based on App ID prefix
    const isProduction = process.env.CASHFREE_ENV === "PRODUCTION" && !appId.startsWith("TEST");
    Cashfree.XEnvironment = isProduction
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

    // Create an instance — PGCreateOrder is an instance method in v5
    const cashfree = new Cashfree();

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

    const response = await cashfree.PGCreateOrder("2023-08-01", request);

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
