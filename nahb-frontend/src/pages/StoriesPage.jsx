import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storiesAPI } from '../services/api';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('');

  useEffect(() => {
    loadStories();
  }, [search, theme]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (theme) params.theme = theme;

      const response = await storiesAPI.getAll(params);
      setStories(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement des histoires');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Histoires publiées
        </h1>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher
              </label>
              <input
                type="text"
                id="search"
                placeholder="Titre ou description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                Thème
              </label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tous les thèmes</option>
                <option value="fantastique">Fantastique</option>
                <option value="science-fiction">Science-fiction</option>
                <option value="horreur">Horreur</option>
                <option value="aventure">Aventure</option>
                <option value="romance">Romance</option>
                <option value="mystère">Mystère</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des histoires */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune histoire trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Link
                key={story._id}
                to={`/story/${story._id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {story.coverImage && (
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {story.description || 'Aucune description'}
                  </p>

                  {story.theme && (
                    <span className="inline-block px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded">
                      {story.theme}
                    </span>
                  )}

                  <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <span>⭐ {story.rating?.average?.toFixed(1) || 'N/A'} ({story.rating?.count || 0})</span>
                    <span>🎮 {story.stats?.totalPlays || 0} parties</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

