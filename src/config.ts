export function readConfig(env: NodeJS.ProcessEnv = process.env): { token: string } {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN est requis dans le fichier .env ou l'environnement.");
  }
  return { token };
}
