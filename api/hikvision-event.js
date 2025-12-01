// api/hikvision-event.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Only POST allowed' });
    }
  
    console.log('Hikvision event:', req.body);
  
    return res.status(200).json({ status: 'ok' });
  }
  