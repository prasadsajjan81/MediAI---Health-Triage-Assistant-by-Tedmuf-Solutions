import type { VercelRequest, VercelResponse } from '@vercel/node';

// Health check endpoint - Last updated: 2026-03-21
export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ 
    status: "ok", 
    uptime: process.uptime(), 
    env: process.env.NODE_ENV 
  });
}
