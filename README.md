# Crystal Bot

Bot Telegram écrit en TypeScript avec grammY. Les messages sont reçus en long
polling : aucun serveur HTTP, domaine public ou tunnel Cloudflare n'est nécessaire.

## Installation

Prérequis : Node.js 22.9 ou supérieur et npm.

```sh
npm ci
cp .env.example .env # uniquement si .env n'existe pas encore
```

Créer un bot auprès de [@BotFather](https://t.me/BotFather), puis renseigner son
token dans `.env` :

```dotenv
TELEGRAM_BOT_TOKEN=votre_token_botfather
```

Le fichier `.env` reste local et ignoré par Git. Les variables définies dans
l'environnement sont prioritaires. Le programme refuse de démarrer sans token.

## Lancement

```sh
npm run dev # TypeScript avec redémarrage automatique
npm start   # compilation puis lancement de dist/index.js
```

Ouvrir le bot dans Telegram et lui envoyer `/start`.
Garder le processus actif pour qu'il reçoive les messages ; utiliser Ctrl+C pour
l'arrêter. Lancer une seule instance en long polling avec le même token.
grammY désactive un éventuel webhook Telegram lors du démarrage du polling,
sans supprimer les événements en attente.

## Comportement

- `/start` présente le bot.
- `/help` affiche les commandes disponibles.
- Un message texte reçoit « Message reçu. ».
- Les commandes inconnues, celles adressées à un autre bot et les messages
  non textuels sont ignorés.

Le traitement métier reste à implémenter dans `src/bot.ts`. Les erreurs sont
journalisées sans afficher le token ni le contenu des messages.

## Vérification

```sh
npm run typecheck
npm test
npm run build
```

Les tests TypeScript simulent l'API Telegram avec un token fictif. Ils n'envoient
aucun message réel.

Documentation : [grammY](https://grammy.dev/guide/getting-started) et
[API Telegram](https://core.telegram.org/bots/api).
