import express from "express";
import crypto from "node:crypto";

export function createApp({ verifyToken, appSecret }) {
  if (typeof verifyToken !== "string" || !verifyToken.trim()) {
    throw new Error("MESSENGER_VERIFY_TOKEN est requis dans l'environnement.");
  }
  if (typeof appSecret !== "string" || !appSecret.trim()) {
    throw new Error("META_APP_SECRET est requis dans l'environnement.");
  }

  const app = express();

  app.get("/webhook/messenger", (req, res) => {
    if (
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === verifyToken &&
      typeof req.query["hub.challenge"] === "string"
    ) {
      return res.status(200).type("text/plain").send(req.query["hub.challenge"]);
    }

    res.sendStatus(403);
  });

  // Conserver le corps brut : la signature porte sur les octets reçus.
  app.post("/webhook/messenger", express.raw({ type: "application/json", inflate: false }), (req, res) => {
    const signature = req.headers["x-hub-signature-256"];
    if (typeof signature !== "string" || !/^sha256=[a-f0-9]{64}$/.test(signature)) {
      return res.sendStatus(403);
    }
    if (!Buffer.isBuffer(req.body)) {
      return res.sendStatus(400);
    }

    const expected = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(req.body)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.sendStatus(403);
    }

    let event;
    try {
      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.sendStatus(400);
    }
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      return res.sendStatus(400);
    }

    console.log("Événement Messenger reçu :", event.object);
    // Transmettre les messages à Crystal Bot ici.
    res.sendStatus(200);
  });

  return app;
}
