import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storiesAPI } from '../services/api';

export default function MyStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newStory, setNewStory] = useState({
    title: '',
    description: '',
    theme: '',
    tags: '',
    status: 'brouillon',
  });

  useEffect(() => {
    loadMyStories();
  }, []);

  const loadMyStories = async () => {
    try {
      setLoading(true);
      const response = await storiesAPI.getMy();
      setStories(response.data.data);
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async (e) => {
    e.preventDefault();

    try {
      const data = {
        ...newStory,
        tags: newStory.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      await storiesAPI.create(data);

      setShowCreateModal(false);
      setNewStory({
        title: '',
        description: '',
        theme: '',
        tags: '',
        status: 'brouillon',
      });

      loadMyStories();
      alert('Histoire créée avec succès !');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la création');
    }
  };

  const handleUpdateStory = async (id, updatedData) => {
    try {
      await storiesAPI.update(id, updatedData);
      loadMyStories();
      alert('Histoire mise à jour avec succès');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteStory = async (id, title) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
      return;
    }

    try {
      await storiesAPI.delete(id);
      loadMyStories();
      alert('Histoire supprimée avec succès');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes histoires</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
          >
            ➕ Nouvelle histoire
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {stories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              Vous n'avez pas encore créé d'histoire
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Créer ma première histoire
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div
                key={story._id}
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {story.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        story.status === 'publié'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {story.status}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {story.description || 'Aucune description'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>🎮 {story.stats?.totalPlays || 0}</span>
                    <span>⭐ {story.rating?.average?.toFixed(1) || 'N/A'}</span>
                    <span>✅ {story.stats?.totalCompletions || 0}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                        to={`/story/${story._id}/edit`}
                        className="flex-1 bg-indigo-600 text-white text-center py-2 rounded hover:bg-indigo-700 text-sm font-medium"
                    >
                      ✏️ Éditer
                    </Link>
                    <button
                      onClick={() => handleDeleteStory(story._id, story.title)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de création */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Créer une nouvelle histoire
              </h2>

              <form onSubmit={handleCreateStory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={255}
                    value={newStory.title}
                    onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Le titre de votre histoire"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={newStory.description}
                    onChange={(e) => setNewStory({ ...newStory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Décrivez votre histoire..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thème
                  </label>
                  <select
                    value={newStory.theme}
                    onChange={(e) => setNewStory({ ...newStory, theme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Aucun thème</option>
                    <option value="fantastique">Fantastique</option>
                    <option value="science-fiction">Science-fiction</option>
                    <option value="horreur">Horreur</option>
                    <option value="aventure">Aventure</option>
                    <option value="romance">Romance</option>
                    <option value="mystère">Mystère</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={newStory.tags}
                    onChange={(e) => setNewStory({ ...newStory, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="ex: médiéval, dragons, quête"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={newStory.status}
                    onChange={(e) => setNewStory({ ...newStory, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="publié">Publié</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

