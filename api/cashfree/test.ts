import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET for testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Cashfree, CFEnvironment, Configuration } = await import("cashfree-pg");

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

    // Auto-detect environment based on App ID prefix
    const isProduction = process.env.CASHFREE_ENV === "PRODUCTION" && !appId.startsWith("TEST");
    const env = isProduction
      ? (CFEnvironment as any).PRODUCTION
      : (CFEnvironment as any).SANDBOX;

    let cashfree;
    if (Configuration) {
      const config = new (Configuration as any)({
        xClientId: appId,
        xClientSecret: secretKey,
        xEnvironment: env
      });
      cashfree = new (Cashfree as any)(config);
    } else {
      // v5 SDK fallback: set static properties, then instantiate
      (Cashfree as any).XClientId = appId;
      (Cashfree as any).XClientSecret = secretKey;
      (Cashfree as any).XEnvironment = env;
      cashfree = new (Cashfree as any)();
    }

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

    const response = await cashfree.PGCreateOrder(request);

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
