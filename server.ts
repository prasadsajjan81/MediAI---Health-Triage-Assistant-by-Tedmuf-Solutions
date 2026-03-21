import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import Razorpay from "razorpay";
// import { Cashfree } from "cashfree-pg";
import crypto from "crypto";
import * as https from "https";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 3000;

async function startServer() {
  console.log("--- Starting Vishwasini - MediAI Server ---");
  const app = express();

  // app.use(cors());
  app.use(express.json());

  // Razorpay setup
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_your_key_id",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "your_key_secret",
  });
  console.log("Razorpay SDK initialized.");

  // Cashfree setup
  const CFModule = await import("cashfree-pg");
  const Cashfree = CFModule.Cashfree || (CFModule as any).default?.Cashfree;
  const CFEnvironment = CFModule.CFEnvironment || (CFModule as any).default?.CFEnvironment;

  if (!Cashfree) {
    console.error("Cashfree object not found in module. Available keys:", Object.keys(CFModule));
  } else {
    console.log("Cashfree object found. Available methods:", Object.keys(Cashfree).filter(k => typeof (Cashfree as any)[k] === 'function'));
    Cashfree.XClientId = process.env.CASHFREE_APP_ID || "TEST_APP_ID";
    Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY || "TEST_SECRET_KEY";
    Cashfree.XEnvironment = process.env.CASHFREE_ENV === "PRODUCTION" 
      ? CFEnvironment?.PRODUCTION || "PRODUCTION"
      : CFEnvironment?.SANDBOX || "SANDBOX";
    console.log(`Cashfree SDK initialized in ${process.env.CASHFREE_ENV || 'SANDBOX'} mode.`);
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      uptime: process.uptime(), 
      env: process.env.NODE_ENV,
      cashfreeConfigured: !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY && process.env.CASHFREE_APP_ID !== 'your_cashfree_app_id_here')
    });
  });

  app.get("/api/payments/config", (req, res) => {
    const appId = process.env.CASHFREE_APP_ID;
    res.json({ 
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_your_key_id",
      cashfreeAppId: appId || "NOT_SET",
      cashfreeEnv: process.env.CASHFREE_ENV || "TEST",
      isConfigured: !!(appId && appId !== 'your_cashfree_app_id_here' && appId !== 'TEST_APP_ID')
    });
  });

  // Cashfree Test Route (for preview debugging)
  app.get("/api/cashfree/test", async (req, res) => {
    const appId = (process.env.CASHFREE_APP_ID || '').trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
    const envVar = (process.env.CASHFREE_ENV || 'PRODUCTION').trim();

    if (!appId || !secretKey || appId === 'your_cashfree_app_id_here') {
      return res.status(500).json({
        error: 'Cashfree credentials not configured',
        fix: 'Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables.'
      });
    }

    const configuredAsProduction = envVar === 'PRODUCTION';

    try {
      const host = configuredAsProduction ? 'api.cashfree.com' : 'sandbox.cashfree.com';
      
      const postData = JSON.stringify({
        order_amount: 1.00,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'test_verification',
          customer_phone: '9999999999',
          customer_email: 'test@example.com',
          customer_name: 'Verification Test',
        },
        order_meta: {
          return_url: `${req.headers.origin || 'https://vishwasini.com'}/payment-status?order_id={order_id}`,
        },
      });

      const options = {
        hostname: host,
        port: 443,
        path: '/pg/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const cashfreeResponse = await new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });
          response.on('end', () => {
            try {
              const parsedData = JSON.parse(data);
              resolve({
                statusCode: response.statusCode,
                data: parsedData
              });
            } catch (e) {
              reject(new Error('Failed to parse Cashfree response'));
            }
          });
        });

        request.on('error', (error) => {
          reject(error);
        });

        request.write(postData);
        request.end();
      }) as any;

      if (cashfreeResponse.statusCode >= 400) {
        let fix = null;
        if (cashfreeResponse.data?.type === 'authentication_error') {
          fix = `Authentication failed. Your keys and CASHFREE_ENV must match the SAME mode. Current CASHFREE_ENV="${envVar}". Go to your Cashfree dashboard, ensure you are in ${configuredAsProduction ? 'Production' : 'Sandbox'} mode, and copy the correct App ID + Secret Key from there.`;
        }
        return res.status(500).json({
          status: 'ERROR',
          error: 'Cashfree API call failed',
          cashfree_error: cashfreeResponse.data,
          fix,
          debug: { appIdPrefix: appId.substring(0, 6), envUsed: envVar }
        });
      }

      return res.status(200).json({
        status: 'SUCCESS',
        message: 'Cashfree is working correctly',
        method: 'direct-rest-no-sdk',
        order_id: cashfreeResponse.data?.order_id,
        environment: envVar,
      });

    } catch (error: any) {
      return res.status(500).json({
        status: 'ERROR',
        error: error.message,
        debug: { appIdPrefix: appId.substring(0, 6), envUsed: envVar }
      });
    }
  });

  // Cashfree Order Creation
  app.post("/api/cashfree/order", async (req, res) => {
    try {
      const appId = (process.env.CASHFREE_APP_ID || '').trim();
      const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
      const envVar = (process.env.CASHFREE_ENV || 'PRODUCTION').trim();

      if (!appId || !secretKey || appId === 'your_cashfree_app_id_here' || appId === 'TEST_APP_ID') {
        return res.status(500).json({
          error: 'Cashfree credentials not configured',
          message: 'Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in your environment variables.'
        });
      }

      const { amount, customerId, customerPhone, customerEmail, customerName } = req.body;

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const host = envVar === 'PRODUCTION' ? 'api.cashfree.com' : 'sandbox.cashfree.com';
      
      const postData = JSON.stringify({
        order_amount: Number(amount),
        order_currency: 'INR',
        customer_details: {
          customer_id: customerId || `cust_${Date.now()}`,
          customer_phone: customerPhone || '9999999999',
          customer_email: customerEmail || 'user@example.com',
          customer_name: customerName || 'User',
        },
        order_meta: {
          return_url: `${req.headers.origin || 'https://vishwasini.com'}/payment-status?order_id={order_id}`,
        },
      });

      const options = {
        hostname: host,
        port: 443,
        path: '/pg/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const cashfreeResponse = await new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });
          response.on('end', () => {
            try {
              const parsedData = JSON.parse(data);
              resolve({
                statusCode: response.statusCode,
                data: parsedData
              });
            } catch (e) {
              reject(new Error('Failed to parse Cashfree response'));
            }
          });
        });

        request.on('error', (error) => {
          reject(error);
        });

        request.write(postData);
        request.end();
      }) as any;

      if (cashfreeResponse.statusCode >= 400) {
        return res.status(cashfreeResponse.statusCode).json({
          error: 'Cashfree order creation failed',
          details: cashfreeResponse.data
        });
      }

      console.log('Cashfree order created:', cashfreeResponse.data.order_id);
      return res.status(200).json({
        ...cashfreeResponse.data,
        method: 'direct-rest-no-sdk'
      });

    } catch (error: any) {
      console.error('Cashfree order error:', error.message);
      return res.status(500).json({
        error: 'Failed to create Cashfree order',
        details: error.message
      });
    }
  });

  app.post("/api/payments/order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      
      const options = {
        amount: Math.round(Number(amount) * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      console.log("Razorpay order created:", order.id);
      res.json(order);
    } catch (error: any) {
      console.error("Razorpay order error:", error);
      res.status(500).json({ error: "Failed to create order", details: error.message });
    }
  });

  app.post("/api/payments/verify", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "your_key_secret")
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        res.json({ status: "success", message: "Payment verified successfully" });
      } else {
        res.status(400).json({ status: "failure", message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite Integration
  const isProd = process.env.NODE_ENV === "production";
  console.log(`Environment: ${isProd ? 'Production' : 'Development'}`);

  if (!isProd) {
    console.log("Initializing Vite Middleware...");
    try {
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false,
          host: '0.0.0.0',
          port: 3000
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite Middleware Ready.");
    } catch (viteErr) {
      console.error("Failed to initialize Vite middleware:", viteErr);
    }
  } else {
    const distPath = path.resolve(__dirname, "dist");
    console.log(`Serving static files from: ${distPath}`);
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.error("Dist folder not found in production mode!");
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Server failed to start:", err);
  process.exit(1);
});
