import { Bot, GrammyError, HttpError, type BotConfig, type Context } from "grammy";

export function describeError(error: unknown): string {
  if (error instanceof GrammyError) {
    return `Telegram a refusé la requête (code ${error.error_code}).`;
  }
  if (error instanceof HttpError) {
    return "Connexion à Telegram impossible. Vérifier le réseau.";
  }
  // Les erreurs brutes peuvent contenir une URL incluant le token.
  return "Erreur du bot. Vérifier la configuration et relancer le processus.";
}

export function createBot(token: string, options?: BotConfig<Context>): Bot {
  const bot = new Bot(token, options);

  bot.command("start", async (ctx) => {
    await ctx.reply("Bonjour ! Je suis Crystal Bot. Envoie-moi un message ou utilise /help.");
  });

  bot.command("help", async (ctx) => {
    await ctx.reply("/start — Présentation de Crystal Bot\n/help — Afficher l'aide\n\nEnvoie un texte pour vérifier sa réception.");
  });

  bot.on("message:text", async (ctx) => {
    if (ctx.message.entities?.some((entity) => entity.type === "bot_command" && entity.offset === 0)) {
      return;
    }
    // Brancher ici le traitement des messages par Crystal Bot.
    await ctx.reply("Message reçu.");
  });

  bot.catch(({ error, ctx }) => {
    console.error(`Échec du traitement de l'événement ${ctx.update.update_id}. ${describeError(error)}`);
  });

  return bot;
}
