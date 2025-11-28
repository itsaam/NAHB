# Refactoring Frontend NAHB - Avant/Après

## Résumé des modifications

Ce document décrit les changements effectués lors du refactoring du frontend NAHB pour améliorer la séparation des responsabilités et la maintenabilité du code.

### Problème initial

- Un seul fichier `api.js` contenait tous les appels API (220+ lignes)
- Les pages contenaient des composants complexes inline (modals, tabs)
- Fichiers trop longs : `AdminDashboard.jsx` (958 lignes), `StoryEditorPage.jsx` (1102 lignes)
- Difficulté à réutiliser les composants

### Solution appliquée

- Création de **services séparés** pour chaque domaine API
- Extraction des **composants réutilisables** depuis les grosses pages
- Architecture **Page → Composants → Services → API**

---

## Structure AVANT

```
src/
├── services/
│   └── api.js                  ← Tous les appels API (220+ lignes)
├── components/
│   ├── Navbar.jsx
│   ├── StoryTree.jsx
│   ├── SuggestImageButton.jsx
│   ├── auth/
│   └── ui/
├── pages/
│   ├── AdminDashboard.jsx      ← 958 lignes, 6 tabs inline
│   ├── StoryEditorPage.jsx     ← 1102 lignes, 4 modals inline
│   └── ...
└── ...
```

## Structure APRÈS

```
src/
├── services/
│   ├── index.js                ← Export centralisé + rétro-compatibilité
│   ├── authService.js          ← Authentification
│   ├── storiesService.js       ← Histoires
│   ├── pagesService.js         ← Pages d'histoires
│   ├── gameService.js          ← Sessions de jeu
│   ├── reviewsService.js       ← Avis
│   ├── reportsService.js       ← Signalements
│   ├── adminService.js         ← Administration
│   ├── themesService.js        ← Thèmes et images
│   └── imageSuggestionsService.js ← Suggestions d'images
├── components/
│   ├── Navbar.jsx
│   ├── StoryTree.jsx
│   ├── SuggestImageButton.jsx
│   ├── auth/
│   ├── ui/
│   ├── adminDashboard/         ← NOUVEAU
│       ├── index.js
│       ├── StatsTab.jsx
│       ├── UsersTab.jsx
│       ├── StoriesTab.jsx
│       ├── ReportsTab.jsx
│       ├── ThemesTab.jsx
│       ├── SuggestionsTab.jsx
│       ├── CreateThemeModal.jsx
│       └── AddImageModal.jsx
│   ├── StarRating.jsx          ← NOUVEAU (composant réutilisable)
│   ├── StoryCard.jsx           ← NOUVEAU (carte d'histoire)
│   ├── Modal.jsx               ← NOUVEAU (modal générique)
│   ├── LoadingSpinner.jsx      ← NOUVEAU (spinner de chargement)
│   └── ErrorMessage.jsx        ← NOUVEAU (message d'erreur)
├── pages/
│   ├── AdminDashboard.jsx      ← ~320 lignes (refactorisé, -66%)
│   ├── StoryEditorPage.jsx     ← 1102 lignes (state trop couplé)
│   ├── MyStoriesPage.jsx       ← 560 lignes (OK)
│   ├── ReadStoryPage.jsx       ← 539 lignes (OK)
│   └── StoryDetailPage.jsx     ← 435 lignes (OK)
│   └── ...
└── ...
```

---

## Services créés (10 fichiers)

### `services/authService.js`

Gère l'authentification :

- `register(userData)` - Inscription
- `login(credentials)` - Connexion
- `logout()` - Déconnexion
- `getCurrentUser()` - Utilisateur connecté
- `forgotPassword(email)` - Mot de passe oublié
- `resetPassword(token, password)` - Réinitialiser

### `services/storiesService.js`

Gère les histoires :

- `getAll(params)` - Liste des histoires
- `getById(id)` - Détails d'une histoire
- `getMine()` - Mes histoires
- `create(data)` - Créer
- `update(id, data)` - Modifier
- `delete(id)` - Supprimer
- `publish(id)` - Publier
- `addPlay(id)` - Ajouter une partie
- `addEnding(id, endingLabel)` - Ajouter une fin

### `services/pagesService.js`

Gère les pages d'histoires :

- `getByStory(storyId)` - Pages d'une histoire
- `create(data)` - Créer une page
- `update(pageId, data)` - Modifier
- `delete(pageId)` - Supprimer
- `addChoice(pageId, choice)` - Ajouter un choix
- `deleteChoice(pageId, choiceId)` - Supprimer un choix

### `services/gameService.js`

Gère les sessions de jeu :

- `startOrResume(storyId)` - Démarrer/reprendre
- `makeChoice(sessionId, choiceId, choiceDetails)` - Faire un choix
- `getMySessions()` - Mes sessions
- `getMyUnlockedEndings(storyId)` - Fins débloquées

### `services/reviewsService.js`

Gère les avis :

- `getByStory(storyId)` - Avis d'une histoire
- `getMine()` - Mes avis
- `create(review)` - Créer un avis
- `update(reviewId, data)` - Modifier
- `delete(reviewId)` - Supprimer

### `services/reportsService.js`

Gère les signalements :

- `create(report)` - Créer un signalement
- `getMine()` - Mes signalements

### `services/adminService.js`

Gère l'administration :

- `getStats()` - Statistiques globales
- `getUsers()` - Liste des utilisateurs
- `getStories()` - Liste des histoires
- `getReports()` - Liste des signalements
- `banUser(userId, banType, reason)` - Bannir
- `unbanUser(userId)` - Débannir
- `suspendStory(storyId)` - Suspendre histoire
- `unsuspendStory(storyId)` - Réactiver histoire
- `handleReport(reportId, action)` - Traiter signalement

### `services/themesService.js`

Gère les thèmes :

- `getAll()` - Tous les thèmes
- `create(data)` - Créer
- `update(id, data)` - Modifier
- `delete(id)` - Supprimer
- `addImage(themeId, imageData)` - Ajouter image
- `deleteImage(imageId)` - Supprimer image

### `services/imageSuggestionsService.js`

Gère les suggestions d'images :

- `create(suggestion)` - Proposer une image
- `getMine()` - Mes suggestions
- `getAll(params)` - Toutes (admin)
- `approve(id)` - Approuver
- `reject(id)` - Refuser

### `services/index.js`

Export centralisé avec rétro-compatibilité :

```javascript
// Nouveaux services
export { default as authService } from "./authService";
export { default as storiesService } from "./storiesService";
// ...

// Rétro-compatibilité avec l'ancien api.js
export const authAPI = authService;
export const storiesAPI = storiesService;
// ...
```

---

## Composants AdminDashboard (8 fichiers)

### `components/adminDashboard/StatsTab.jsx`

Affiche les cartes de statistiques (utilisateurs, histoires, parties, avis, signalements, bans).

### `components/adminDashboard/UsersTab.jsx`

Tableau de gestion des utilisateurs avec actions de ban :

- Ban complet
- Ban auteur (interdit de créer des histoires)
- Ban commentaire
- Débannir

### `components/adminDashboard/StoriesTab.jsx`

Liste des histoires avec action suspendre/réactiver.

### `components/adminDashboard/ReportsTab.jsx`

Liste des signalements avec actions résoudre/rejeter.

### `components/adminDashboard/ThemesTab.jsx`

Gestion des thèmes et du catalogue d'images :

- Créer/supprimer des thèmes
- Ajouter/supprimer des images au catalogue

### `components/adminDashboard/SuggestionsTab.jsx`

Grille des suggestions d'images en attente avec actions approuver/refuser.

### `components/adminDashboard/CreateThemeModal.jsx`

Modal de création d'un nouveau thème (nom, description, image par défaut).

### `components/adminDashboard/AddImageModal.jsx`

Modal d'ajout d'une image au catalogue d'un thème.

---

## Exemples de changements

### AdminDashboard.jsx

**AVANT** (958 lignes) :

```jsx
export default function AdminDashboard() {
  // ... 30+ états
  // ... 15+ handlers
  // ... 800+ lignes de JSX avec 6 tabs inline
  return (
    <div>
      {/* 6 blocs de tabs de 100+ lignes chacun */}
      {activeTab === "stats" && (
        <div className="grid...">{/* 80 lignes de JSX */}</div>
      )}
      {activeTab === "users" && (
        <div className="...">{/* 120 lignes de JSX */}</div>
      )}
      {/* ... */}
    </div>
  );
}
```

**APRÈS** (~270 lignes) :

```jsx
import {
  StatsTab,
  UsersTab,
  StoriesTab,
  ReportsTab,
  ThemesTab,
  SuggestionsTab,
  CreateThemeModal,
  AddImageModal,
} from "../components/adminDashboard";

export default function AdminDashboard() {
  // États et handlers regroupés par domaine

  const renderTabContent = () => {
    switch (activeTab) {
      case "stats":
        return <StatsTab stats={stats} />;
      case "users":
        return <UsersTab users={users} onBanUser={handleBanUser} onUnbanUser={handleUnbanUser} />;
      // ...
    }
  };

  return (
    <div>
      {renderTabContent()}
      <CreateThemeModal isOpen={showThemeModal} onClose={...} onSubmit={...} />
      <AddImageModal isOpen={showImageModal} onClose={...} onSubmit={...} theme={selectedTheme} />
    </div>
  );
}
```

### Import des services

**AVANT** :

```jsx
import { storiesAPI, pagesAPI, themesAPI } from "../services/api";
```

**APRÈS** (deux options) :

```jsx
// Option 1: Nouveaux services
import { storiesService, pagesService, themesService } from "../services";

// Option 2: Rétro-compatibilité (fonctionne aussi)
import { storiesAPI, pagesAPI, themesAPI } from "../services/api";
```

---

## Avantages du refactoring

1. **Fichiers plus courts** : AdminDashboard passe de 958 à ~270 lignes (-70%)
2. **Réutilisabilité** : Les composants peuvent être utilisés ailleurs
3. **Maintenabilité** : Chaque composant a une responsabilité unique
4. **Testabilité** : Composants isolés plus faciles à tester
5. **Lisibilité** : Code organisé par fonctionnalité
6. **Rétro-compatibilité** : Les anciens imports continuent de fonctionner

---

## Fichiers modifiés

| Fichier              | Avant      | Après                   | Changement |
| -------------------- | ---------- | ----------------------- | ---------- |
| `AdminDashboard.jsx` | 958 lignes | ~320 lignes             | -66%       |
| `api.js`             | 220 lignes | Remplacé par 9 services | Séparation |

## Fichiers créés

| Dossier                      | Fichiers    | Description                                                                           |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `services/`                  | 10 fichiers | Services API séparés                                                                  |
| `components/adminDashboard/` | 9 fichiers  | Composants du dashboard admin                                                         |
| `components/`                | 5 fichiers  | Composants réutilisables (StarRating, StoryCard, Modal, LoadingSpinner, ErrorMessage) |

---

## Convention de nommage

Tous les fichiers respectent la convention **camelCase** :

- `authService.js`
- `storiesService.js`
- `CreateThemeModal.jsx` (PascalCase pour composants React)
- ~~`auth_service.js`~~ (snake_case)
- ~~`create-theme-modal.jsx`~~ (kebab-case)

---

## Prochaines améliorations possibles

1. **StoryEditorPage.jsx** : Le state est très couplé, difficile à extraire sans refonte majeure
2. **Tests** : Ajouter des tests unitaires pour les services et composants
3. **Utiliser les nouveaux composants** : Intégrer `StarRating`, `StoryCard`, `Modal` dans les pages existantes

---

## Checklist

| Vérification                       | Statut |
| ---------------------------------- | ------ |
| Services API séparés               | OK     |
| Composants AdminDashboard extraits | OK     |
| AdminDashboard refactorisé         | OK     |
| Rétro-compatibilité imports        | OK     |
| Convention camelCase               | OK     |
| Documentation                      | OK     |
