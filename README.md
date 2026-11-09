# Crystal Bot

Serveur Express pour recevoir les webhooks Messenger. Les événements valides
sont actuellement journalisés ; le traitement des messages par Crystal Bot
reste à brancher dans `src/app.js`.

## Démarrage

Prérequis : Node.js 22.9 ou supérieur, avec npm.

```sh
npm ci
cp .env.example .env # uniquement si .env n'existe pas encore
```

Renseigner dans `.env` :

- `PORT` : port HTTP, `3000` par défaut.
- `MESSENGER_VERIFY_TOKEN` : jeton de votre choix, identique à celui configuré chez Meta.
- `META_APP_SECRET` : secret de l'application Meta, utilisé pour vérifier les signatures.

Le `.env` est chargé au démarrage et reste ignoré par Git. Les variables déjà
définies dans l'environnement sont prioritaires. Le serveur refuse de démarrer
si le jeton de vérification ou le secret Meta est vide.

```sh
npm start
# Avec redémarrage automatique pendant le développement :
npm run dev
```

## Webhook

Configurer chez Meta l'URL publique HTTPS :
`https://votre-domaine/webhook/messenger`.

- `GET /webhook/messenger` renvoie le challenge en texte si le mode et le jeton
  sont valides ; sinon, il renvoie `403`.
- `POST /webhook/messenger` vérifie `x-hub-signature-256` par HMAC-SHA256 sur le
  corps brut, puis lit le JSON. Une signature invalide renvoie `403`, un corps
  invalide renvoie `400`, et un événement accepté renvoie `200`.

Ne pas placer de middleware `express.json()` avant cette route : la vérification
nécessite les octets originaux du corps JSON.

## Tests

```sh
npm test
```

Les tests utilisent des identifiants fictifs et un serveur HTTP local temporaire.
