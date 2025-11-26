import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { storiesAPI } from '../services/api';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { storiesAPI } from "../services/api";
import { Search, BookOpen, Star } from "lucide-react";

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [search, setSearch] = useState('');
  const [theme, setTheme] = useState('');
  const [lastParams, setLastParams] = useState(null);

  // Debounce pour la recherche
  const searchTimeout = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("");

  useEffect(() => {
    loadStories();
  }, [debouncedSearch, theme]);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorDetails(null);

      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (theme) params.theme = theme;

      // Garder une trace des params envoyés (debug)
      setLastParams(params);
      console.debug('Fetching /api/stories with params:', params);

      const response = await storiesAPI.getAll(params);

      // Vérifier la structure attendue
      if (!response || !response.data || !response.data.data) {
        throw new Error('Réponse API inattendue');
      }

      setStories(response.data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des histoires', err);
      setError('Erreur lors du chargement des histoires');

      // Remplir des détails utiles pour debug
      const details = {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      };
      setErrorDetails(details);
      setError("Erreur lors du chargement des histoires");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Découvrir les histoires</h1>
            <p className="text-lg text-muted-foreground">
              Explorez notre collection d'aventures narratives interactives
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une histoire..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="flex h-10 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Tous les thèmes</option>
              <option value="fantastique">Fantastique</option>
              <option value="science-fiction">Science-Fiction</option>
              <option value="horreur">Horreur</option>
              <option value="aventure">Aventure</option>
              <option value="romance">Romance</option>
              <option value="mystère">Mystère</option>
            </select>
          </div>

        {/* Affichage d'erreur détaillé pour debug */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
            <div>{error}</div>
            {errorDetails && (
              <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">{JSON.stringify(errorDetails, null, 2)}</pre>
            )}
            {lastParams && (
              <div className="mt-2 text-xs text-gray-600">Params envoyés: {JSON.stringify(lastParams)}</div>
            )}
          </div>
        )}

        {/* Liste des histoires */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement...</p>
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

          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}


          {/* Stories Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Link
                  key={story._id}
                  to={`/story/${story._id}`}
                  className="group rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {story.coverImage ? (
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {story.theme || "Aucun thème"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-2">
                    <h3 className="font-semibold text-lg leading-none tracking-tight line-clamp-1">
                      {story.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {story.description}
                    </p>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{story.stats?.totalPlays || 0} lectures</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span>
                          {story.rating?.average?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
