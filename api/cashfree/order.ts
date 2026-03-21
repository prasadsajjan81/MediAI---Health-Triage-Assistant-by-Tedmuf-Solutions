import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Cashfree order request body:", JSON.stringify(req.body));
    
    // Import the module
    const CFModule = await import("cashfree-pg");
    
    // Deep search for PGCreateOrder
    const findFunction = (obj: any, path = "root", depth = 0): any => {
      if (depth > 3 || !obj || typeof obj !== 'object') return null;
      if (typeof obj.PGCreateOrder === 'function') return obj;
      
      for (const key of Object.keys(obj)) {
        try {
          const found = findFunction(obj[key], `${path}.${key}`, depth + 1);
          if (found) return found;
        } catch (e) {}
      }
      return null;
    };

    const cf = findFunction(CFModule);

    if (!cf || typeof cf.PGCreateOrder !== 'function') {
      console.error("Cashfree module structure keys:", Object.keys(CFModule));
      if ((CFModule as any).default) console.error("Default export keys:", Object.keys((CFModule as any).default));
      throw new Error(`Cashfree SDK failed to load: Could not find valid Cashfree object with PGCreateOrder. Found keys: ${Object.keys(CFModule).join(', ')}`);
    }

    // Initialize Cashfree inside handler
    const appId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
    const secretKey = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY";
    
    cf.XClientId = appId;
    cf.XClientSecret = secretKey;
    
    // Handle Environment
    const env = process.env.CASHFREE_ENV === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
    if (cf.Environment) {
      cf.XEnvironment = cf.Environment[env];
    } else if (cf.CFEnvironment) {
      cf.XEnvironment = cf.CFEnvironment[env];
    } else {
      cf.XEnvironment = env;
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
