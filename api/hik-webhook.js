// api/hik-webhook.js
const admin = require("firebase-admin");

// Firebase init फक्त गरज पडली तेव्हा करतो
function getDb() {
  if (!admin.apps.length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!sa) {
      console.warn("FIREBASE_SERVICE_ACCOUNT env var missing, using default app");
      admin.initializeApp(); // local dev साठी ठीक, production ला proper key लागेल
    } else {
      try {
        const parsed = JSON.parse(sa);
        admin.initializeApp({
          credential: admin.credential.cert(parsed),
        });
      } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", e);
        // crash टाळायला fallback
        admin.initializeApp();
      }
    }
  }

  return admin.firestore();
}

module.exports = async (req, res) => {
  // GET = health-check (Firebase ला touch नको)
  if (req.method === "GET") {
    return res.status(200).json({ status: "ok-get", msg: "webhook working" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // इथेच Firebase वापरू
  const db = getDb();

  console.log("HikCentral Event:", req.body);

  try {
    const body = req.body || {};

    const empId =
      body.personId ||
      body.employeeNo ||
      body.cardNo ||
      body.cardNumber ||
      (body.acsEvent && body.acsEvent.employeeNo);

    if (!empId) {
      console.warn("No empId in event, skipping");
      return res.status(200).json({ status: "ignored", reason: "no-empId" });
    }

    const eventTimeStr =
      body.time ||
      body.eventTime ||
      body.eventTimeStr ||
      (body.acsEvent && body.acsEvent.time) ||
      new Date().toISOString();

    const date = new Date(eventTimeStr);
    const dateKey = date.toISOString().slice(0, 10); // YYYY-MM-DD

    const docId = `${empId}_${dateKey}`;
    const docRef = db.collection("canteenCoupons").doc(docId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);

      // आधीच redeemed असेल तर duplicate ignore
      if (snap.exists && snap.data() && snap.data().redeemed) {
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
        { merge: true }
      );
    });

    return res.status(200).json({ status: "ok", empId, date: dateKey });
  } catch (err) {
    console.error("Webhook error:", err);
    return res
      .status(500)
      .json({ status: "error", message: err.message || "unknown" });
  }
};
