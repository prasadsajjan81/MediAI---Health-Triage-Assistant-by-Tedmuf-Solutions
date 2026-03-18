import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from "crypto";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.status(200).json({ status: "success" });
    } else {
      return res.status(400).json({ status: "failure" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
