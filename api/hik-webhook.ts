import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var missing');
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
  });
}

const db = admin.firestore();

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok-get', msg: 'webhook working' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  console.log('HikCentral event body:', req.body);

  try {
    const body: any = req.body;

    const empId =
      body.personId ||
      body.employeeNo ||
      body.cardNo ||
      body.cardNumber ||
      body?.acsEvent?.employeeNo;

    if (!empId) {
      console.warn('No empId in event, skipping');
      return res.status(200).json({ status: 'ignored', reason: 'no-empId' });
    }

    const eventTimeStr =
      body.time ||
      body.eventTime ||
      body.eventTimeStr ||
      body?.acsEvent?.time ||
      new Date().toISOString();

    const eventDate = new Date(eventTimeStr);
    const dateKey = eventDate.toISOString().slice(0, 10);
    const docId = `${empId}_${dateKey}`;
    const docRef = db.collection('canteenCoupons').doc(docId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);

      if (snap.exists && snap.data()?.redeemed) {
        return;
      }

      tx.set(
        docRef,
        {
          empId,
          date: dateKey,
          eventTime: eventTimeStr,
          redeemed: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return res.status(200).json({ status: 'ok', empId, date: dateKey });
  } catch (err: any) {
    console.error('webhook error', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
