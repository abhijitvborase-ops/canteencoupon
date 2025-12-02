// api/hik-webhook.js

export default async function handler(req, res) {
    // GET request साठी – browser ने test करण्यासाठी
    if (req.method === 'GET') {
      return res.status(200).json({ status: 'ok-get', msg: 'webhook working' });
    }
  
    // पुढे HikCentral कडून POST येईल
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST allowed' });
    }
  
    console.log('HikCentral event body:', req.body);
  
    return res.status(200).json({ status: 'ok' });
  }
  