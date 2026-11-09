import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { once } from "node:events";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

const verifyToken = "test-verify-token";
const appSecret = "test-app-secret";
let server;
let baseUrl;

before(async () => {
  server = createApp({ verifyToken, appSecret }).listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}/webhook/messenger`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

function sign(body, secret = appSecret) {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

function post(body, signature = sign(body), contentType = "application/json") {
  const headers = { "content-type": contentType };
  if (signature !== null) headers["x-hub-signature-256"] = signature;
  return fetch(baseUrl, { method: "POST", headers, body });
}

test("refuse une configuration incomplète", () => {
  assert.throws(() => createApp({ appSecret }), /MESSENGER_VERIFY_TOKEN/);
  assert.throws(() => createApp({ verifyToken, appSecret: " " }), /META_APP_SECRET/);
});

test("renvoie exactement le challenge avec le bon jeton", async () => {
  const query = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": verifyToken,
    "hub.challenge": "123456",
  });
  const response = await fetch(`${baseUrl}?${query}`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "123456");
});

test("refuse une vérification invalide ou incomplète", async () => {
  for (const params of [
    { "hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "123" },
    { "hub.mode": "invalid", "hub.verify_token": verifyToken, "hub.challenge": "123" },
    { "hub.mode": "subscribe", "hub.verify_token": verifyToken },
    {},
  ]) {
    assert.equal((await fetch(`${baseUrl}?${new URLSearchParams(params)}`)).status, 403);
  }
});

test("accepte un événement signé sur le corps brut avec espaces et accents", async () => {
  const body = '{ "object": "page", "entry": [], "text": "été" }\n';
  assert.equal((await post(body)).status, 200);
});

test("refuse les signatures absentes, malformées, erronées et les corps altérés", async () => {
  const body = '{"object":"page"}';
  for (const signature of [null, "sha256=short", "sha256=" + "é".repeat(64), sign(body, "wrong-secret")]) {
    assert.equal((await post(body, signature)).status, 403);
  }
  assert.equal((await post(body + " ", sign(body))).status, 403);
});

test("refuse un JSON signé invalide sans interrompre le serveur", async () => {
  for (const body of ["{", "null", "[]", '"text"']) {
    assert.equal((await post(body)).status, 400);
  }
  assert.equal((await post('{"object":"page"}')).status, 200);
});

test("refuse un corps dont le type n'est pas JSON", async () => {
  assert.equal((await post('{"object":"page"}', undefined, "text/plain")).status, 400);
});
