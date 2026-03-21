import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Cashfree order request body:", JSON.stringify(req.body));
    
    // Import the module
    const CFModule = await import("cashfree-pg");
    
    // Robust discovery logic
    let cf: any = null;
    const candidates = [
      (CFModule as any).Cashfree,
      (CFModule as any).default?.Cashfree,
      (CFModule as any).default,
      CFModule
    ];
    
    for (const cand of candidates) {
      if (cand && typeof cand.PGCreateOrder === 'function') {
        cf = cand;
        break;
      }
    }

    if (!cf || typeof cf.PGCreateOrder !== 'function') {
      console.error("Cashfree module structure keys:", Object.keys(CFModule));
      if ((CFModule as any).default) console.error("Default export keys:", Object.keys((CFModule as any).default));
      
      // One more try: check if it's nested inside the named Cashfree export
      if ((CFModule as any).Cashfree && (CFModule as any).Cashfree.Cashfree) {
        cf = (CFModule as any).Cashfree.Cashfree;
      }
      
      if (!cf || typeof cf.PGCreateOrder !== 'function') {
        throw new Error(`Cashfree SDK failed to load: Could not find valid Cashfree object with PGCreateOrder. Found keys: ${Object.keys(CFModule).join(', ')}`);
      }
    }

    // Initialize Cashfree inside handler
    const appId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
    const secretKey = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY";
    
    cf.XClientId = appId;
    cf.XClientSecret = secretKey;
    
    // Handle Environment
    if (cf.Environment) {
      cf.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
        ? cf.Environment.PRODUCTION 
        : cf.Environment.SANDBOX;
    } else if (cf.CFEnvironment) {
      cf.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
        ? cf.CFEnvironment.PRODUCTION 
        : cf.CFEnvironment.SANDBOX;
    } else {
      cf.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
    }

    console.log(`Initializing Cashfree with AppID: ${appId.substring(0, 4)}... in ${process.env.CASHFREE_ENV || 'SANDBOX'} mode.`);

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
    
    const response = await cf.PGCreateOrder("2023-08-01", request);
    
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
