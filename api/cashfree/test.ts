import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET for testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const CFModule = await import("cashfree-pg");
    const results: any = {
      moduleKeys: Object.keys(CFModule),
      attempts: []
    };

    // Deep search for PGCreateOrder
    const findFunction = (obj: any, path = "root", depth = 0): string | null => {
      if (depth > 3 || !obj || typeof obj !== 'object') return null;
      if (typeof obj.PGCreateOrder === 'function') return path;
      
      for (const key of Object.keys(obj)) {
        try {
          const found = findFunction(obj[key], `${path}.${key}`, depth + 1);
          if (found) return found;
        } catch (e) {}
      }
      return null;
    };

    const functionPath = findFunction(CFModule);
    results.foundPath = functionPath;

    if (!functionPath) {
      return res.status(500).json({
        error: "Could not find PGCreateOrder anywhere in the module",
        results
      });
    }

    // Get the function and its parent object
    const pathParts = functionPath.split('.');
    let cf: any = CFModule;
    for (let i = 1; i < pathParts.length; i++) {
      cf = cf[pathParts[i]];
    }

    results.finalObjectKeys = Object.keys(cf);

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    if (!appId || !secretKey) {
      return res.status(500).json({ error: "Cashfree credentials not configured", results });
    }
    
    // Initialize
    cf.XClientId = appId;
    cf.XClientSecret = secretKey;
    
    const env = process.env.CASHFREE_ENV === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
    if (cf.Environment) {
      cf.XEnvironment = cf.Environment[env];
    } else if (cf.CFEnvironment) {
      cf.XEnvironment = cf.CFEnvironment[env];
    } else {
      cf.XEnvironment = env;
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

    const response = await cf.PGCreateOrder("2023-08-01", request);
    
    return res.status(200).json({ 
      status: "SUCCESS",
      pathUsed: functionPath,
      order_id: response.data?.order_id,
      results
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
