module.exports = (req, res) => {
    console.log("Webhook call:", req.method);
  
    if (req.method === "GET") {
      return res.status(200).json({ status: "ok-get", msg: "webhook working" });
    }
  
    if (req.method === "POST") {
      return res.status(200).json({ status: "ok-post", msg: "posted" });
    }
  
    return res.status(405).json({ message: "Method Not Allowed" });
  };
  