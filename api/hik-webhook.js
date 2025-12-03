// api/hik-webhook.js

module.exports = (req, res) => {
    console.log("Hik webhook test, method =", req.method);
  
    if (req.method === "GET") {
      return res.status(200).json({ status: "ok-get-test" });
    }
  
    if (req.method === "POST") {
      console.log("Body:", req.body);
      return res.status(200).json({ status: "ok-post-test" });
    }
  
    return res.status(405).json({ error: "Only GET/POST allowed" });
  };
  