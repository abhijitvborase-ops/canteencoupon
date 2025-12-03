// api/hik-webhook.js  (ES module)

export default function handler(req, res) {
    console.log("Hik webhook test, method =", req.method);
  
    if (req.method === "GET") {
      return res.status(200).json({ status: "ok-get", msg: "webhook working" });
    }
  
    if (req.method === "POST") {
      console.log("Body:", req.body);
      return res.status(200).json({ status: "ok-post", msg: "posted" });
    }
  
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  