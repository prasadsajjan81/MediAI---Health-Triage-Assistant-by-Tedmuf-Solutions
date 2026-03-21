import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Cashfree order request body:", JSON.stringify(req.body));
    const CashfreeModule = await import("cashfree-pg");
    const Cashfree = CashfreeModule.Cashfree || (CashfreeModule as any).default?.Cashfree || CashfreeModule;
    
    if (!Cashfree) {
      throw new Error("Cashfree SDK failed to load");
    }

    // Initialize Cashfree inside handler
    const appId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
    const secretKey = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY";
    
    // Safe access to Environment
    const cfEnv = (Cashfree as any).Environment || {};
    const env = process.env.CASHFREE_ENV === "PRODUCTION" 
      ? (cfEnv.PRODUCTION || "PRODUCTION")
      : (cfEnv.SANDBOX || "SANDBOX");

    console.log(`Initializing Cashfree with AppID: ${appId.substring(0, 4)}... in ${process.env.CASHFREE_ENV || 'SANDBOX'} mode.`);

    (Cashfree as any).XClientId = appId;
    (Cashfree as any).XClientSecret = secretKey;
    (Cashfree as any).XEnvironment = env;

    const { amount, customerId, customerPhone, customerEmail, customerName } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }
    
    const request = {
      order_amount: Number(amount),
      order_currency: "INR",
      customer_details: {
        customer_id: customerId || `cust_${Date.now()}`,
        customer_phone: customerPhone || "9999999999",
        customer_email: customerEmail || "test@example.com",
        customer_name: customerName || "Test User"
      },
      order_meta: {
        return_url: `${req.headers.origin}/payment-status?order_id={order_id}`
      }
    };

    const response = await (Cashfree as any).PGCreateOrder("2023-08-01", request);
    
    if (!response.data || !response.data.payment_session_id) {
      console.error("Cashfree order creation failed - missing session ID:", response.data);
      return res.status(400).json({ 
        error: "Cashfree order creation failed", 
        details: response.data 
      });
    }

    console.log("Cashfree order created:", response.data.order_id);
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Cashfree order error:", error.response?.data || error.message);
    return res.status(500).json({ 
      error: "Failed to create Cashfree order", 
      details: error.response?.data || error.message 
    });
  }
}
