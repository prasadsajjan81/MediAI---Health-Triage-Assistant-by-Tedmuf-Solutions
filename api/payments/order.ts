import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from "razorpay";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Razorpay order request body:", JSON.stringify(req.body));
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
    });

    const { amount, currency = "INR" } = req.body;
    
    const options = {
      amount: Math.round(Number(amount) * 100), // amount in the smallest currency unit (paise)
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
}
