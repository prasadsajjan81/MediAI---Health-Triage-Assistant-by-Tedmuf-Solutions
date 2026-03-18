import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 3000;

async function startServer() {
  console.log("--- Starting Vishwasini - MediAI Server ---");
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Razorpay setup (Lazy initialization)
  const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret || key_id === 'rzp_test_placeholder') {
      return null;
    }
    
    try {
      const RZP = (Razorpay as any).default || Razorpay;
      return new RZP({
        key_id,
        key_secret,
      });
    } catch (err) {
      console.error("Error initializing Razorpay:", err);
      return null;
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/payments/config", (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY || "rzp_test_placeholder";
    res.json({ keyId });
  });

  app.post("/api/payments/order", async (req, res) => {
    try {
      const rzp = getRazorpay();
      if (!rzp) {
        return res.status(500).json({ error: "Razorpay API keys are not configured." });
      }

      const { amount, currency = "USD" } = req.body;
      const options = {
        amount: Math.round(Number(amount) * 100),
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await rzp.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Razorpay order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/payments/verify", async (req, res) => {
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
        res.json({ status: "success" });
      } else {
        res.status(400).json({ status: "failure" });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite Middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Middleware Ready.");
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Server failed to start:", err);
  process.exit(1);
});
