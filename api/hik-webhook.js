// api/hik-webhook.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST allowed' });
    }
  
    console.log('HikCentral event body:', req.body);
  
    // इथे नंतर Firebase logic टाकू; आत्ता फक्त OK परत पाठवू
    return res.status(200).json({ status: 'ok' });
  }
  