// api/hik-webhook.js

import admin from 'firebase-admin';   // require ऐवजी import

// Firebase init (example)
if (!admin.apps.length) {
  admin.initializeApp({
    // इथे तुझं config किंवा service account
  });
}

// Vercel serverless function handler (ESM style)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('Hikvision Webhook Body:', req.body);

  // इथे तू Firebase, Firestore वगैरे ला data save करू शकतोस

  return res.status(200).json({ success: true });
}
