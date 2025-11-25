import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { storiesAPI } from "../services/api";
import { Plus, Edit, Trash2, BookOpen, Star } from "lucide-react";

export default function MyStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStory, setNewStory] = useState({
    title: "",
    description: "",
    theme: "",
    tags: "",
    status: "brouillon",
  });

  useEffect(() => {
    loadMyStories();
  }, []);

  const loadMyStories = async () => {
    try {
      const response = await storiesAPI.getMy();
      setStories(response.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...newStory,
        tags: newStory.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
      };
      await storiesAPI.create(data);
      setShowModal(false);
      setNewStory({
        title: "",
        description: "",
        theme: "",
        tags: "",
        status: "brouillon",
      });
      loadMyStories();
      alert("Histoire créée");
    } catch (err) {
      alert(err.response?.data?.error || "Erreur");
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    try {
      await storiesAPI.delete(id);
      loadMyStories();
      alert("Histoire supprimée");
    } catch (err) {
      alert(err.response?.data?.error || "Erreur");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 md:px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold">Mes histoires</h1>
              <p className="text-lg text-muted-foreground">
                Gérez et créez vos aventures narratives
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 h-11 rounded-md px-8 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity border-2 border-black"
            >
              <Plus className="h-5 w-5" />
              Nouvelle histoire
            </button>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore créé d'histoire
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Créer ma première histoire
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div
                  key={story._id}
                  className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {story.coverImage ? (
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          story.status === "publié"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {story.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg leading-none tracking-tight line-clamp-1 mb-2">
                        {story.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {story.description || "Aucune description"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{story.stats?.totalPlays || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>
                          {story.rating?.average?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>✅ {story.stats?.totalCompletions || 0}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link
                        to={`/story/${story._id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        <Edit className="h-4 w-4" />
                        Éditer
                      </Link>
                      <button
                        onClick={() => handleDelete(story._id, story.title)}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  Créer une nouvelle histoire
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Commencez votre aventure narrative en remplissant les
                  informations ci-dessous
                </p>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="title"
                    className="text-sm font-medium leading-none"
                  >
                    Titre
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    minLength={3}
                    placeholder="Le titre de votre histoire"
                    value={newStory.title}
                    onChange={(e) =>
                      setNewStory({ ...newStory, title: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium leading-none"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    placeholder="Décrivez brièvement votre histoire"
                    rows={6}
                    value={newStory.description}
                    onChange={(e) =>
                      setNewStory({ ...newStory, description: e.target.value })
                    }
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="theme"
                    className="text-sm font-medium leading-none"
                  >
                    Thème
                  </label>
                  <select
                    id="theme"
                    value={newStory.theme}
                    onChange={(e) =>
                      setNewStory({ ...newStory, theme: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choisir un thème</option>
                    <option value="fantastique">Fantastique</option>
                    <option value="science-fiction">Science-Fiction</option>
                    <option value="horreur">Horreur</option>
                    <option value="aventure">Aventure</option>
                    <option value="romance">Romance</option>
                    <option value="mystère">Mystère</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="tags"
                    className="text-sm font-medium leading-none"
                  >
                    Tags
                  </label>
                  <input
                    id="tags"
                    type="text"
                    placeholder="ex: médiéval, dragons, quête"
                    value={newStory.tags}
                    onChange={(e) =>
                      setNewStory({ ...newStory, tags: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground">
                    Séparez les tags par des virgules
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="text-sm font-medium leading-none"
                  >
                    Statut
                  </label>
                  <select
                    id="status"
                    value={newStory.status}
                    onChange={(e) =>
                      setNewStory({ ...newStory, status: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="publié">Publié</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 inline-flex items-center justify-center h-10 rounded-md px-4 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center h-10 rounded-md px-4 text-sm font-medium bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
