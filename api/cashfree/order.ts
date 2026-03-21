import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Cashfree order request body:", JSON.stringify(req.body));

    const { Cashfree, CFEnvironment } = await import("cashfree-pg");

    const appId = (process.env.CASHFREE_APP_ID || "").trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();

    if (!appId || !secretKey || appId === 'your_cashfree_app_id_here' || appId === 'TEST_APP_ID') {
      return res.status(500).json({
        error: "Cashfree credentials not configured",
        message: "Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables."
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

    console.log(`Initializing Cashfree with AppID: ${appId.substring(0, 4)}... in ${isProduction ? 'PRODUCTION' : 'SANDBOX'} mode.`);

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

    console.log("Calling PGCreateOrder...");

    const response = await cashfree.PGCreateOrder("2023-08-01", request);

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
