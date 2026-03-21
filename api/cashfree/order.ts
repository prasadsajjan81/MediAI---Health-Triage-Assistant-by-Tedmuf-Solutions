import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as https from 'https';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
