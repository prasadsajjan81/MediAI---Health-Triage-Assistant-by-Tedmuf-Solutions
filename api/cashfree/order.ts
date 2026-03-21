import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Cashfree } from "cashfree-pg";

// Initialize Cashfree
(Cashfree as any).XClientId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
(Cashfree as any).XClientSecret = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY";
(Cashfree as any).XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
  ? (Cashfree as any).Environment.PRODUCTION 
  : (Cashfree as any).Environment.SANDBOX;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, customerId, customerPhone, customerEmail, customerName } = req.body;
    
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
