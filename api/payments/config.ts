import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({ 
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_your_key_id",
    cashfreeAppId: process.env.CASHFREE_APP_ID || "your_cashfree_app_id_here",
    cashfreeEnv: process.env.CASHFREE_ENV || "TEST"
  });
}
