import assert from "node:assert/strict";
import test from "node:test";
import type { Update, UserFromGetMe } from "grammy/types";
import { GrammyError } from "grammy";
import { createBot, describeError } from "../src/bot.js";
import { readConfig } from "../src/config.js";

const botInfo: UserFromGetMe = {
  id: 123456, is_bot: true, first_name: "Crystal Bot", username: "crystal_test_bot",
  can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false,
  can_connect_to_business: false, has_main_web_app: false,
  has_topics_enabled: false, allows_users_to_create_topics: false,
  can_manage_bots: false, supports_join_request_queries: false,
};

function setup() {
  const calls: { method: string; payload: Record<string, unknown> }[] = [];
  const bot = createBot("123456:test-token", {
    botInfo,
    client: {
      fetch: async (input: string | URL | Request, init?: RequestInit) => {
        const method = String(input).split("/").at(-1)!;
        const payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
        calls.push({ method, payload });
        return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  });
  return { bot, calls };
}

function message(text: string): Update {
  const command = text.startsWith("/") ? text.split(" ")[0]! : undefined;
  return {
    update_id: 1,
    message: {
      message_id: 1, date: 0,
      chat: { id: 42, type: "private", first_name: "Test" },
      from: { id: 42, is_bot: false, first_name: "Test" },
      text,
      ...(command ? { entities: [{ type: "bot_command" as const, offset: 0, length: command.length }] } : {}),
    },
  };
}

test("exige le token Telegram et retire les espaces autour", () => {
  assert.throws(() => readConfig({}), /TELEGRAM_BOT_TOKEN/);
  assert.throws(() => readConfig({ TELEGRAM_BOT_TOKEN: " " }), /TELEGRAM_BOT_TOKEN/);
  assert.deepEqual(readConfig({ TELEGRAM_BOT_TOKEN: " 123:test " }), { token: "123:test" });
});

test("/start répond dans la conversation d'origine", async () => {
  const { bot, calls } = setup();
  await bot.handleUpdate(message("/start"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.method, "sendMessage");
  assert.equal(calls[0]?.payload.chat_id, 42);
  assert.match(String(calls[0]?.payload.text), /Crystal Bot/);
});

test("/help et les commandes adressées au bot sont reconnues", async () => {
  const { bot, calls } = setup();
  await bot.handleUpdate(message("/help@crystal_test_bot"));
  assert.equal(calls.length, 1);
  assert.match(String(calls[0]?.payload.text), /\/start/);
});

test("accuse réception d'un texte sans en recopier le contenu", async () => {
  const { bot, calls } = setup();
  await bot.handleUpdate(message("Bonjour, été 🔮"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.payload.text, "Message reçu.");
});

test("ignore les autres bots, les commandes inconnues et les messages non textuels", async () => {
  const { bot, calls } = setup();
  await bot.handleUpdate(message("/start@another_bot"));
  await bot.handleUpdate(message("/unknown"));
  await bot.handleUpdate({
    update_id: 2,
    message: {
      message_id: 2, date: 0,
      chat: { id: 42, type: "private", first_name: "Test" },
      from: { id: 42, is_bot: false, first_name: "Test" },
      photo: [{ file_id: "photo", file_unique_id: "unique", width: 1, height: 1 }],
    },
  });
  assert.deepEqual(calls, []);
});

test("les messages d'erreur ne révèlent pas les URL contenant le token", () => {
  assert.doesNotMatch(describeError(new Error("https://api.telegram.org/botSECRET/getMe")), /SECRET/);
  const error = new GrammyError("sendMessage", {
    ok: false, error_code: 429, description: "secret à ne pas journaliser",
  }, "sendMessage", {});
  assert.match(describeError(error), /429/);
  assert.doesNotMatch(describeError(error), /secret/);
});
