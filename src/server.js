import { createApp } from "./app.js";

const app = createApp({
  verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
  appSecret: process.env.META_APP_SECRET,
});

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT doit être un entier entre 1 et 65535.");
}

app.listen(port, () => {
  console.log(`Crystal Bot écoute sur le port ${port}.`);
});
