import { createBot, describeError } from "./bot.js";
import { readConfig } from "./config.js";

async function main(): Promise<void> {
  const { token } = readConfig();
  const bot = createBot(token);

  const stop = (): void => {
    if (bot.isRunning()) {
      void bot.stop().catch(() => {
        console.error("L'arrêt du bot a échoué.");
        process.exitCode = 1;
      });
    }
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await bot.start({
      allowed_updates: ["message"],
      onStart: (info) => {
        console.log(`Crystal Bot est connecté à Telegram : @${info.username}.`);
      },
    });
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}

main().catch((error: unknown) => {
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    console.error("TELEGRAM_BOT_TOKEN est requis dans le fichier .env ou l'environnement.");
  } else {
    console.error(describeError(error));
  }
  process.exitCode = 1;
});
