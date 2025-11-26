# 🎨 NAHB Frontend

Interface utilisateur React pour la plateforme NAHB (Not Another Hero's Book).

## 🛠️ Technologies

- **React 18** + **Vite** (build rapide)
- **Tailwind CSS** (styling)
- **React Router** (navigation)
- **Axios** (requêtes API)
- **Lucide React** (icônes)
- **React Flow** (visualisation arbre des histoires)

## 🚀 Installation

```bash
npm install
npm run dev
```

Le serveur de développement démarre sur `http://localhost:5173`

## 📦 Build

```bash
npm run build
```

Les fichiers de production sont générés dans le dossier `dist/`

## 🎨 Palette de couleurs

Le site utilise une palette personnalisée définie dans `src/index.css` :

| Couleur         | Code HEX  | Utilisation                 |
| --------------- | --------- | --------------------------- |
| **Cherry Rose** | `#d42b55` | Boutons, CTAs, liens actifs |
| **Pale Sky**    | `#edf2f8` | Fonds, bordures             |
| **Coffee Bean** | `#1c1718` | Textes                      |
| **Neon Ice**    | `#03fcf0` | Accents, badges             |
| **Seaweed**     | `#00ffd5` | États de succès             |

### Exemples d'utilisation

```jsx
// Bouton principal
<button className="bg-cherry-rose-500 text-white hover:bg-cherry-rose-600">
  Action
</button>

// Texte
<p className="text-coffee-bean-900">Contenu</p>

// Fond de page
<div className="bg-pale-sky-50">...</div>

// Badge accent
<span className="bg-neon-ice-500 text-neon-ice-900">Admin</span>

// Message succès
<p className="text-seaweed-600">Sauvegardé !</p>
```

## 📁 Structure

```
src/
├── components/     # Composants réutilisables (Navbar, etc.)
├── context/        # Contextes React (Auth, etc.)
├── hooks/          # Hooks personnalisés
├── lib/            # Utilitaires
├── pages/          # Pages de l'application
├── services/       # Services API
└── index.css       # Styles globaux + palette couleurs
```

## 🔗 Variables d'environnement

Créer un fichier `.env` :

```env
VITE_API_URL=http://localhost:3002/api
```
