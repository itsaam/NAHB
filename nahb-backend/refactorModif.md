# Refactoring Backend NAHB - Avant/Après

## Résumé des modifications

Ce document décrit les changements effectués lors du refactoring du backend NAHB pour améliorer la séparation des responsabilités et la maintenabilité du code.

### Problème initial

- Les controllers contenaient directement les requêtes SQL (`pool.query()`)
- Mélange de la logique métier et de l'accès aux données
- Code difficile à maintenir et à tester

### Solution appliquée

- Création d'une **couche services** pour isoler les requêtes SQL
- Controllers allégés qui délèguent l'accès aux données aux services
- Architecture **Controller → Service → Database**

---

## Structure AVANT

```
src/
├── controllers/
│   ├── adminController.js      ← SQL + logique métier mélangés
│   ├── authController.js       ← SQL + logique métier mélangés
│   ├── gameController.js       ← SQL + logique métier mélangés
│   ├── imageSuggestionController.js ← SQL + logique métier mélangés
│   ├── pageController.js       ← MongoDB uniquement (OK)
│   ├── reportController.js     ← SQL + logique métier mélangés
│   ├── reviewController.js     ← SQL + logique métier mélangés
│   ├── storyController.js      ← MongoDB uniquement (OK)
│   ├── themeController.js      ← SQL + logique métier mélangés
│   └── userController.js       ← SQL + logique métier mélangés
├── config/
├── middlewares/
├── models/
├── routes/
└── utils/
```

## Structure APRÈS

```
src/
├── controllers/
│   ├── adminController.js      ← Utilise les services
│   ├── authController.js       ← Utilise userService
│   ├── gameController.js       ← Utilise gameSessionService, sessionPathService, unlockedEndingService
│   ├── imageSuggestionController.js ← Utilise themeService, imageSuggestionService
│   ├── pageController.js       ← MongoDB uniquement (inchangé)
│   ├── reportController.js     ← Utilise reportService
│   ├── reviewController.js     ← Utilise reviewService
│   ├── storyController.js      ← MongoDB uniquement (inchangé)
│   ├── themeController.js      ← Utilise themeService
│   └── userController.js       ← Utilise reviewService, unlockedEndingService
├── services/                   ← NOUVEAU DOSSIER
│   ├── index.js                ← Export centralisé
│   ├── gameSessionService.js   ← Gestion des sessions de jeu
│   ├── imageSuggestionService.js ← Suggestions d'images
│   ├── reportService.js        ← Signalements
│   ├── reviewService.js        ← Avis utilisateurs
│   ├── sessionPathService.js   ← Parcours de session
│   ├── themeService.js         ← Thèmes et catalogue d'images
│   ├── unlockedEndingService.js ← Fins débloquées
│   └── userService.js          ← Utilisateurs et authentification
├── config/
├── middlewares/
├── models/
├── routes/
└── utils/
```

---

## Détails des changements par fichier

### Services créés (9 fichiers)

#### `services/userService.js`

Gère toutes les opérations utilisateur PostgreSQL :

- `findByEmail(email)` - Rechercher par email
- `findByPseudo(pseudo)` - Rechercher par pseudo
- `findById(id)` - Rechercher par ID
- `create(userData)` - Créer un utilisateur
- `updateProfile(id, updates)` - Mettre à jour le profil
- `updatePassword(id, hashedPassword)` - Changer le mot de passe
- `getPassword(id)` - Récupérer le hash du mot de passe
- `setResetToken(id, token, expiry)` - Définir le token de reset
- `findByResetToken(token)` - Trouver par token de reset
- `clearResetToken(id)` - Effacer le token de reset
- `checkEmailExists(email, excludeId)` - Vérifier si email existe
- `getBanStatus(id)` - Obtenir le statut de ban
- `findAll()` - Lister tous les utilisateurs
- `ban(id, reason, bannedBy)` - Bannir un utilisateur
- `unban(id)` - Débannir un utilisateur
- `getStats()` - Statistiques utilisateurs

#### `services/reviewService.js`

Gère les avis :

- `findByUserAndStory(userId, storyMongoId)` - Trouver avis existant
- `create(reviewData)` - Créer un avis
- `update(id, updates)` - Mettre à jour un avis
- `findById(id)` - Trouver par ID
- `deleteById(id)` - Supprimer par ID
- `findByStory(storyMongoId)` - Avis d'une histoire
- `findByUser(userId)` - Avis d'un utilisateur
- `getStoryRatingStats(storyMongoId)` - Stats de notation
- `getGlobalStats()` - Stats globales

#### `services/reportService.js`

Gère les signalements :

- `create(reportData)` - Créer un signalement
- `findById(id)` - Trouver par ID
- `findByUser(userId)` - Signalements d'un utilisateur
- `findAll()` - Tous les signalements
- `updateStatus(id, status, resolvedBy)` - Mettre à jour le statut
- `countResolvedByStory(storyMongoId)` - Compter par histoire
- `getGlobalStats()` - Stats globales

#### `services/gameSessionService.js`

Gère les sessions de jeu :

- `findActiveSession(userId, storyMongoId)` - Session active
- `findById(id)` - Trouver par ID
- `create(sessionData)` - Créer une session
- `updateCurrentPage(id, updates)` - Mettre à jour la page courante
- `findByUser(userId)` - Sessions d'un utilisateur
- `getUserActivities(userId)` - Activités utilisateur
- `getGlobalStats()` - Stats globales

#### `services/sessionPathService.js`

Gère les parcours de session :

- `addStep(sessionId, pageMongoId, choiceId)` - Ajouter une étape
- `getBySession(sessionId)` - Parcours d'une session
- `getAllPathsByStory(storyMongoId)` - Tous les parcours d'une histoire

#### `services/unlockedEndingService.js`

Gère les fins débloquées :

- `unlock(userId, storyMongoId, endPageMongoId)` - Débloquer une fin
- `findByUserAndStory(userId, storyMongoId)` - Fins débloquées
- `getEndPageIdsByUserAndStory(userId, storyMongoId)` - IDs des fins
- `getByUserAndStory(userId, storyMongoId)` - Détails des fins
- `getEndingStats(storyMongoId, endPageMongoId)` - Stats d'une fin

#### `services/themeService.js`

Gère les thèmes et le catalogue d'images :

- `findAll()` - Lister tous les thèmes
- `findById(id)` - Trouver par ID
- `exists(id)` - Vérifier existence
- `create(themeData)` - Créer un thème
- `update(id, updates)` - Mettre à jour
- `deleteById(id)` - Supprimer
- `addImage(themeId, imageUrl)` - Ajouter une image
- `deleteImage(id)` - Supprimer une image
- `getAllImages()` - Toutes les images
- `imageExistsInCatalog(imageUrl)` - Vérifier si image existe

#### `services/imageSuggestionService.js`

Gère les suggestions d'images :

- `create(suggestionData)` - Créer une suggestion
- `findPendingByThemeAndUrl(themeId, imageUrl)` - Vérifier doublon
- `findPendingById(id)` - Suggestion en attente par ID
- `findAll()` - Toutes les suggestions
- `findByUser(userId)` - Suggestions d'un utilisateur
- `approve(id, approvedBy)` - Approuver
- `reject(id, rejectedBy)` - Rejeter

#### `services/index.js`

Export centralisé de tous les services.

---

## Exemples de changements

### Exemple 1: authController.js

**AVANT** (requête SQL directe) :

```javascript
const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.rows[0];
  // ... suite de la logique
};
```

**APRÈS** (utilisation du service) :

```javascript
const userService = require("../services/userService");

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await userService.findByEmail(email);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // ... suite de la logique
};
```

### Exemple 2: gameController.js

**AVANT** :

```javascript
const startGame = async (req, res) => {
  // Recherche session existante avec SQL direct
  const existingSession = await pool.query(
    `SELECT * FROM game_sessions 
     WHERE user_postgres_id = $1 
     AND story_mongo_id = $2 
     AND is_completed = false`,
    [userId, storyMongoId]
  );

  // Création session avec SQL direct
  const newSession = await pool.query(
    `INSERT INTO game_sessions (user_postgres_id, story_mongo_id, current_page_mongo_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, storyMongoId, startPageId]
  );
};
```

**APRÈS** :

```javascript
const gameSessionService = require("../services/gameSessionService");

const startGame = async (req, res) => {
  // Recherche via service
  const existingSession = await gameSessionService.findActiveSession(
    userId,
    storyMongoId
  );

  // Création via service
  const newSession = await gameSessionService.create({
    userId,
    storyMongoId,
    currentPageMongoId: startPageId,
  });
};
```

---

## Avantages du refactoring

1. **Séparation des responsabilités** : Les controllers gèrent les requêtes HTTP, les services gèrent l'accès aux données
2. **Réutilisabilité** : Les méthodes de service peuvent être appelées depuis plusieurs controllers
3. **Testabilité** : Les services peuvent être mockés facilement pour les tests unitaires
4. **Maintenabilité** : Changements de requêtes SQL centralisés dans les services
5. **Lisibilité** : Code plus propre et plus facile à comprendre

---

## Fichiers inchangés

- `storyController.js` - Utilise uniquement MongoDB (Mongoose)
- `pageController.js` - Utilise uniquement MongoDB (Mongoose)
- Tous les fichiers dans `/routes/`, `/middlewares/`, `/config/`, `/utils/`, `/models/`

---

## Convention de nommage

Tous les fichiers respectent la convention **camelCase** :

- `userService.js`
- `gameSessionService.js`
- `authController.js`
- ~~`user_service.js`~~ (snake_case)
- ~~`UserService.js`~~ (PascalCase pour fichiers)

---

## Protection contre les injections SQL

### Comment le code est protégé ?

Toutes les requêtes SQL utilisent des **paramètres préparés** (prepared statements) avec la syntaxe `$1`, `$2`, `$3`... de PostgreSQL.

### Mécanisme de protection

```javascript
// SÉCURISÉ - Ce qu'on fait dans les services
const result = await pool.query(
  "SELECT * FROM users WHERE email = $1", // $1 = placeholder
  [email] // valeur passée séparément
);
```

### Pourquoi c'est sécurisé ?

1. **Séparation requête/données** : La requête SQL et les valeurs sont envoyées séparément à PostgreSQL
2. **Compilation préalable** : PostgreSQL compile la requête AVANT de connaître les valeurs
3. **Échappement automatique** : Les valeurs sont toujours traitées comme des données, jamais comme du code SQL

### Exemple d'attaque bloquée

```javascript
// Tentative d'injection SQL
const email = "'; DROP TABLE users; --";

// VULNÉRABLE (concaténation - NE PAS FAIRE)
`SELECT * FROM users WHERE email = '${email}'`;
// Résultat: SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
// La table users est supprimée !

// SÉCURISÉ (paramètres préparés - CE QU'ON FAIT)
pool.query("SELECT * FROM users WHERE email = $1", [email]);
// PostgreSQL traite "'; DROP TABLE users; --" comme une simple chaîne
// Cherche un email avec cette valeur exacte, ne trouve rien
// Aucun dommage !
```

### Vérification du code

Toutes les requêtes dans `/src/services/*.js` utilisent :

- Placeholders `$1`, `$2`, `$3`... (73 paramètres au total)
- Valeurs passées dans un tableau séparé
- Aucune concaténation directe de données utilisateur dans le SQL

### Les `${...}` dans le code ?

Certains fichiers contiennent `${paramIndex}` ou `${params.length}` — ce n'est **PAS** dangereux car :

- Ce sont des **numéros de paramètres** générés dynamiquement (`$1`, `$2`...)
- Ce ne sont **jamais** des données utilisateur

```javascript
// Exemple sécurisé avec index dynamique
setClauses.push(`email = $${paramIndex++}`); // → "email = $1"
values.push(email); // valeur sécurisée dans le tableau
```

---

## Checklist de sécurité

| Vérification                        | Statut |
| ----------------------------------- | ------ |
| Paramètres préparés (`$1`, `$2`...) | OK     |
| Pas de concaténation SQL directe    | OK     |
| Valeurs dans tableau séparé         | OK     |
| Convention camelCase                | OK     |
| Séparation Controller/Service       | OK     |
