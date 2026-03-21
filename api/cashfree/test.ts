import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET for testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const CFModule = await import("cashfree-pg");
    const Cashfree = (CFModule as any).Cashfree || (CFModule as any).default?.Cashfree || (CFModule as any).default || CFModule;
    
    // Some versions might nest it one level deeper
    const cf = (Cashfree && typeof (Cashfree as any).PGCreateOrder === 'function') ? (Cashfree as any) : (Cashfree as any)?.Cashfree;
    
    if (!cf || typeof cf.PGCreateOrder !== 'function') {
      return res.status(500).json({ 
        error: "Cashfree SDK failed to load: Could not find valid Cashfree object with PGCreateOrder",
        moduleKeys: Object.keys(CFModule)
      });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    if (!appId || !secretKey) {
      return res.status(500).json({ error: "Cashfree credentials not configured in environment variables" });
    }
    
    cf.XClientId = appId;
    cf.XClientSecret = secretKey;
    
    if (cf.Environment) {
      cf.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
        ? cf.Environment.PRODUCTION 
        : cf.Environment.SANDBOX;
    } else {
      cf.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
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

    console.log("Verifying Cashfree credentials...");
    const response = await cf.PGCreateOrder("2023-08-01", request);
    
    if (response.data && response.data.payment_session_id) {
      return res.status(200).json({ 
        status: "SUCCESS",
        message: "Credentials are valid and working!",
        order_id: response.data.order_id,
        environment: process.env.CASHFREE_ENV || "PRODUCTION (Default)"
      });
    } else {
      return res.status(401).json({ 
        status: "FAILED",
        message: "Credentials might be invalid or environment mismatch.",
        details: response.data
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      status: "ERROR",
      message: "An error occurred during verification.",
      error: error.response?.data || error.message
    });
  }
}
