# COM Backend - Unity Shop Authentication

Backend d'authentification pour le projet Unity Shop, conçu pour intégration avec Unity Gaming Services (UGS).

## 🛠️ Stack Technique

- **Runtime** : Node.js (v20+)
- **Langage** : TypeScript
- **Framework** : NestJS
- **Base de Données** : PostgreSQL
- **ORM** : Prisma
- **Authentification** : 
  - Native : Argon2 + JWT
  - Sociale : Google Auth Library, Apple Sign-In

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (v20 ou supérieur)
- [Docker](https://www.docker.com/) & Docker Compose

## 🚀 Installation & Configuration

1. **Cloner le projet**
   ```bash
   git clone <url-repo>
   cd com_backend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   Créez un fichier `.env` à la racine (ou utilisez celui existant) :
   ```env
   # Database (Postgres)
   DATABASE_URL="postgresql://admin:password123@localhost:5432/com_auth_db?schema=public"

   # Security
   JWT_SECRET="votre_super_secret_key"

   # Social Auth (Optionnel en dev, requis pour prod)
   GOOGLE_CLIENT_ID="votre_client_id_google"
   APPLE_CLIENT_ID="votre_service_id_apple"

   # OIDC Configuration (Unity Gaming Services)
   OIDC_ISSUER="http://localhost:3000"
   OIDC_AUDIENCE="unity-game-client"
   ```

4. **Lancer la Base de Données (Docker)**
   ```bash
   docker-compose up -d
   ```

5. **Initialiser la Base de Données (Prisma)**
   ```bash
   # Créer les tables
   npx prisma migrate dev
   
   # Générer le client Prisma
   npx prisma generate
   ```

6. **Générer les Clés OIDC (RSA)**
   Génère une paire de clés dans `secrets/` pour la signature des JWT.
   ```bash
   npm run generate:keys
   ```

   npm run generate:keys
   ```

7. **Générer le Certificat HTTPS (Local)**
   Génère un certificat auto-signé pour le développement local.
   ```bash
   npm run generate:ssl
   ```
   Activez ensuite `HTTPS_ENABLED=true` dans `.env`.

## ▶️ Commandes

| Commande | Description |
|----------|-------------|
| `npm run start:dev` | Lance le serveur en mode développement (watch) |
| `npm run build` | Compile le projet (dist/) |
| `npm run start:prod` | Lance le serveur compilé |
| `npm test` | Lance les tests unitaires et E2E |
| `npm run generate:keys` | Génère les clés RSA pour OIDC |
| `npm run generate:ssl` | Génère le certificat SSL local |

## 🏗️ Structure du Projet

```
.
├── src/
│   ├── auth/          # Module d'authentification (Controller, Service, DTOs)
│   ├── prisma/        # Module d'accès aux données
│   ├── app.module.ts  # Module racine
│   └── main.ts        # Point d'entrée & Config Swagger
├── prisma/
│   └── schema.prisma  # Définition du modèle de données
├── test/              # Tests E2E et unitaires déplacés
└── docker-compose.yml # Infrastructure locale
```

## 📚 Documentation API (Swagger)

Une fois le serveur lancé (`npm run start:dev`), la documentation interactive est accessible sur :

👉 **http://localhost:3000/api/docs**

Vous pourrez y tester directement :
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/apple`
- `GET /.well-known/openid-configuration` (Discovery)
- `GET /.well-known/jwks.json` (Keys)
