# 📚 NAHB - Not Another Hero's Book

![NAHB Banner](./nahb-frontend/public/og-image.jpg)

**Plateforme web fullstack de création et de lecture d'histoires interactives de type "livre dont vous êtes le héros"**

---

## 📖 Description

NAHB est une application web moderne permettant de créer, publier et jouer à des histoires interactives. Les auteurs créent des histoires avec des pages, des choix et des fins multiples. Les lecteurs parcourent ces aventures et découvrent différentes fins selon leurs choix.

### ✨ Fonctionnalités principales

**Pour les auteurs :**

- ✅ Création d'histoires avec titre, description, tags et thème
- ✅ Éditeur graphique de pages et de choix
- ✅ Ajout d'illustrations
- ✅ Gestion de fins multiples nommées
- ✅ Mode brouillon/publié
- ✅ Statistiques de lecture

**Pour les lecteurs :**

- ✅ Bibliothèque d'histoires avec filtres (thème, tags, note)
- ✅ Lecture interactive immersive
- ✅ Sauvegarde automatique de progression
- ✅ Collection de fins débloquées
- ✅ Statistiques de parcours ("X% des joueurs ont pris le même chemin")
- ✅ Notation et commentaires
- ✅ Signalement de contenu

**Pour les administrateurs :**

- ✅ Modération (ban/suspend)
- ✅ Gestion des signalements
- ✅ Statistiques globales

---

## 🛠️ Technologies

### Backend

- **Node.js** + **Express.js**
- **PostgreSQL** (données utilisateurs, sessions, stats)
- **MongoDB** (contenu histoires, pages, choix)
- **JWT** (authentification)
- **Winston** (logs)

### Frontend

- **React** + **Vite**
- **React Router** (navigation)
- **Axios** (requêtes API)
- **Tailwind CSS** (styling moderne)
- **Lucide React** (icônes)

### 🎨 Design & Palette de couleurs

Le site utilise une palette de couleurs personnalisée définie dans `nahb-frontend/src/index.css` :

| Couleur         | Code HEX              | Utilisation                                                               |
| --------------- | --------------------- | ------------------------------------------------------------------------- |
| **Cherry Rose** | `#d42b55`             | Couleur principale - Boutons, CTAs, liens actifs, éléments d'accentuation |
| **Pale Sky**    | `#edf2f8` → `#0e1a25` | Fonds de page, bordures, éléments secondaires                             |
| **Coffee Bean** | `#1c1718` → `#f3f1f2` | Textes (titres, paragraphes, labels)                                      |
| **Neon Ice**    | `#03fcf0`             | Accents, badges spéciaux (ex: admin), éléments de mise en avant           |
| **Seaweed**     | `#00ffd5`             | États de succès, validations, messages positifs                           |

#### Classes Tailwind personnalisées

```css
/* Exemples d'utilisation */
bg-cherry-rose-500    /* Fond bouton principal */
text-coffee-bean-900  /* Texte foncé */
border-pale-sky-300   /* Bordure légère */
bg-neon-ice-500       /* Badge accent */
text-seaweed-600      /* Message succès */
```

#### Principes de design

- **Style** : Moderne, épuré, fond clair
- **Responsive** : Adapté mobile, tablette et desktop
- **Accessible** : Contrastes respectés, navigation clavier

---

## 📦 Installation

### Prérequis

- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **MongoDB** (v6+)
- **Git**

### 1. Cloner le repository

```bash
git clone <URL_DU_REPO>
cd NAHB
```

### 2. Configuration de la base de données

#### PostgreSQL

```sql
CREATE DATABASE nahb_db;
```

Les tables seront créées automatiquement au démarrage du backend.

#### MongoDB

MongoDB se connecte automatiquement avec l'URL fournie dans `.env`.

### 3. Configuration Backend

```bash
cd nahb-backend
npm install
```

Créer un fichier `.env` :

```env
# Serveur
PORT=3002
NODE_ENV=development

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=votre_mot_de_passe
PG_DATABASE=nahb_db

# MongoDB
MONGO_URI=mongodb://localhost:27017/nahb

# JWT
JWT_SECRET=votre_secret_jwt_super_securise
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 4. Configuration Frontend

```bash
cd ../nahb-frontend
npm install
```

Créer un fichier `.env` :

```env
VITE_API_URL=http://localhost:3002/api
```

---

## 🚀 Lancement (Développement)

### 1. Démarrer le backend

```bash
cd nahb-backend
npm run dev
```

Le serveur démarre sur **http://localhost:3002**

Console attendue :

```
✅ Serveur démarré sur le port 3002
✅ MongoDB connecté
✅ PostgreSQL connecté
```

### 2. Démarrer le frontend

```bash
cd nahb-frontend
npm run dev
```

L'application est accessible sur **http://localhost:5173**

---

## 📊 Schémas de base de données

### PostgreSQL - Tables

```
users
├── id (SERIAL PRIMARY KEY)
├── pseudo (VARCHAR UNIQUE)
├── email (VARCHAR UNIQUE)
├── password (VARCHAR)
├── role (VARCHAR) ['lecteur', 'auteur', 'admin']
├── is_banned (BOOLEAN)
└── created_at (TIMESTAMP)

game_sessions
├── id (SERIAL PRIMARY KEY)
├── user_id (INTEGER FK → users)
├── story_mongo_id (VARCHAR)
├── current_page_mongo_id (VARCHAR)
├── end_page_mongo_id (VARCHAR)
├── is_completed (BOOLEAN)
├── is_preview (BOOLEAN)
├── started_at (TIMESTAMP)
├── completed_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

session_paths
├── id (SERIAL PRIMARY KEY)
├── session_id (INTEGER FK → game_sessions)
├── page_mongo_id (VARCHAR)
├── choice_mongo_id (VARCHAR)
├── step_order (INTEGER)
└── created_at (TIMESTAMP)

unlocked_endings
├── id (SERIAL PRIMARY KEY)
├── user_id (INTEGER FK → users)
├── story_mongo_id (VARCHAR)
├── page_mongo_id (VARCHAR)
└── unlocked_at (TIMESTAMP)

reviews
├── id (SERIAL PRIMARY KEY)
├── user_id (INTEGER FK → users)
├── story_mongo_id (VARCHAR)
├── rating (INTEGER CHECK 1-5)
├── comment (TEXT)
└── created_at (TIMESTAMP)

reports
├── id (SERIAL PRIMARY KEY)
├── user_id (INTEGER FK → users)
├── story_mongo_id (VARCHAR)
├── reason (TEXT)
├── status (VARCHAR) ['pending', 'resolved', 'rejected']
└── created_at (TIMESTAMP)
```

### MongoDB - Collections

```javascript
// stories
{
  _id: ObjectId,
  authorPostgresId: Number,
  title: String,
  description: String,
  theme: String,
  tags: [String],
  coverImage: String,
  startPageId: ObjectId,
  status: String, // 'brouillon' | 'publié'
  isSuspended: Boolean,
  stats: {
    totalPlays: Number,
    totalCompletions: Number
  },
  rating: {
    average: Number,
    count: Number
  },
  createdAt: Date,
  updatedAt: Date
}

// pages
{
  _id: ObjectId,
  storyId: ObjectId,
  content: String,
  illustration: String,
  isEnd: Boolean,
  endLabel: String,
  choices: [{
    _id: ObjectId,
    text: String,
    targetPageId: ObjectId
  }],
  stats: {
    timesReached: Number,
    timesCompleted: Number
  }
}
```

---

## 🏗️ Architecture

```
NAHB/
├── nahb-backend/           # API REST Express
│   ├── src/
│   │   ├── config/         # Configs DB
│   │   ├── controllers/    # Logique métier
│   │   ├── middlewares/    # Auth, validation
│   │   ├── models/         # Modèles MongoDB
│   │   ├── routes/         # Définition routes
│   │   ├── utils/          # Logger
│   │   └── server.js       # Point d'entrée
│   ├── logs/               # Fichiers logs
│   └── package.json
│
├── nahb-frontend/          # Application React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── context/        # Context API (Auth)
│   │   ├── pages/          # Pages de l'app
│   │   ├── services/       # API client
│   │   ├── utils/          # Utilitaires
│   │   ├── App.jsx         # Composant racine
│   │   ├── App.css         # Styles composants
│   │   └── index.css       # Styles globaux
│   └── package.json
│
└── nahb-database-schemas/  # Schémas Mermaid
```

---

## 📸 Captures d'écran

### Page d'accueil

![Homepage](./screenshots/homepage.png)

### Bibliothèque d'histoires

![Stories Library](./screenshots/stories.png)

### Lecteur d'histoire

![Story Reader](./screenshots/reader.png)

### Éditeur d'histoire

![Story Editor](./screenshots/editor.png)

### Dashboard Admin

![Admin Dashboard](./screenshots/admin.png)

---

## 🎨 Design System

### Palette de couleurs

```css
Cherry Rose:   #d42b55 (couleur principale - boutons, CTAs)
Pale Sky:      #edf2f8 → #0e1a25 (fonds, bordures)
Coffee Bean:   #1c1718 → #f3f1f2 (textes)
Neon Ice:      #03fcf0 (accents, badges)
Seaweed:       #00ffd5 (succès, validations)
Destructive:   #EF4444 (rouge erreur)
```

### Interface

- Design épuré et moderne, fond clair (Pale Sky)
- Composants UI réutilisables (inspirés shadcn/ui)
- Icônes Lucide React pour cohérence cross-platform
- Animations et transitions fluides
- Responsive mobile-first

### Typographie

- **Police:** Inter (Google Fonts)
- Style moderne et très lisible
- Poids variables (300-900)

---

## 🧪 Tests

_À implémenter_

```bash
# Backend
npm test

# Frontend
npm test
```

---

## 📖 Documentation API

### Authentification

#### POST `/api/auth/register`

Inscription d'un nouvel utilisateur.

**Body:**

```json
{
  "pseudo": "JohnDoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "auteur"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": { "id": 1, "pseudo": "JohnDoe", "role": "auteur" }
  }
}
```

#### POST `/api/auth/login`

Connexion utilisateur.

**Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Histoires

#### GET `/api/stories`

Liste des histoires publiées (avec filtres).

**Query params:**

- `search` - Recherche texte
- `theme` - Filtre par thème
- `tags` - Filtre par tags

#### POST `/api/stories`

Créer une histoire (auteur requis).

**Body:**

```json
{
  "title": "Le Royaume Perdu",
  "description": "Une aventure épique...",
  "theme": "Fantasy",
  "tags": ["aventure", "magie"]
}
```

### Jeu

#### POST `/api/game/start`

Démarrer une partie.

**Body:**

```json
{
  "storyMongoId": "674350f8c8e5b0a2e8d4e123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": 42,
    "storyId": "674350f8c8e5b0a2e8d4e123",
    "currentPage": { ... },
    "resumed": false
  }
}
```

#### POST `/api/game/session/:sessionId/choice`

Faire un choix.

**Body:**

```json
{
  "choiceId": "674350f8c8e5b0a2e8d4e456"
}
```

#### GET `/api/game/session/:sessionId/stats`

Obtenir les statistiques de parcours.

**Response:**

```json
{
  "success": true,
  "data": {
    "pathSimilarity": 37,
    "totalSessions": 150,
    "endStats": {
      "endPageId": "...",
      "timesReached": 18,
      "percentage": 12
    }
  }
}
```

---

## 👥 Contributeurs

- [@itsaam](https://github.com/itsaam)
- [@Mitikx](https://github.com/Mitikx)

Étudiants à [Sup de Vinci](https://www.supdevinci.fr/)

**Repository:** [github.com/itsaam/NAHB](https://github.com/itsaam/NAHB)

---

## 📝 Licence

Ce projet est réalisé dans le cadre d'un projet académique à [Sup de Vinci](https://www.supdevinci.fr/).

---

## 📞 Support

Pour toute question ou problème :

- Créer une issue sur le repository

---

**Développé avec ❤️ et beaucoup de ☕**
