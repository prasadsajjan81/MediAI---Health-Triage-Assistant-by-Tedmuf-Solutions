import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as https from 'https';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
