import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { storiesAPI, themesAPI } from "../services/api";
import { Plus, Edit, Trash2, BookOpen, Star, Images, X } from "lucide-react";
import SuggestImageButton from "../components/SuggestImageButton";

export default function MyStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [themes, setThemes] = useState([]);
  const [showImageCatalog, setShowImageCatalog] = useState(false);
  const [selectedThemeImages, setSelectedThemeImages] = useState([]);
  const [newStory, setNewStory] = useState({
    title: "",
    description: "",
    theme: "",
    tags: "",
    status: "brouillon",
    coverImage: "",
  });

  useEffect(() => {
    loadMyStories();
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const response = await themesAPI.getAll();
      setThemes(response.data.data || []);
    } catch (err) {
      console.error("Erreur chargement thèmes:", err);
    }
  };

  const handleThemeChange = (themeId) => {
    setNewStory({ ...newStory, theme: themeId, coverImage: "" });
    const selectedTheme = themes.find((t) => t.id === parseInt(themeId));
    if (selectedTheme) {
      setSelectedThemeImages(selectedTheme.images || []);
      // Set default image if available
      if (selectedTheme.default_image_url) {
        setNewStory((prev) => ({
          ...prev,
          theme: themeId,
          coverImage: selectedTheme.default_image_url,
        }));
      }
    } else {
      setSelectedThemeImages([]);
    }
  };

  const handleSelectImage = (imageUrl) => {
    setNewStory({ ...newStory, coverImage: imageUrl });
    setShowImageCatalog(false);
  };

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
      // Trouver le nom du thème à partir de l'ID
      const selectedTheme = themes.find(
        (t) => t.id === parseInt(newStory.theme)
      );
      const themeName = selectedTheme ? selectedTheme.name : newStory.theme;

      const data = {
        title: newStory.title,
        description: newStory.description,
        theme: themeName,
        coverImage: newStory.coverImage,
        tags: newStory.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        status: newStory.status,
      };
      await storiesAPI.create(data);
      setShowModal(false);
      setNewStory({
        title: "",
        description: "",
        theme: "",
        tags: "",
        status: "brouillon",
        coverImage: "",
      });
      setSelectedThemeImages([]);
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

  const handlePublish = async (id, title) => {
    if (
      !confirm(`Publier "${title}" ? Elle sera visible par tous les lecteurs.`)
    )
      return;
    try {
      await storiesAPI.update(id, { status: "publié" });
      loadMyStories();
      alert("Histoire publiée avec succès !");
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la publication");
    }
  };

  const handleUnpublish = async (id, title) => {
    if (
      !confirm(
        `Retirer "${title}" de la publication ? Elle redeviendra un brouillon.`
      )
    )
      return;
    try {
      await storiesAPI.update(id, { status: "brouillon" });
      loadMyStories();
      alert("Histoire remise en brouillon");
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
                            ? "bg-seaweed-100 text-seaweed-800"
                            : "bg-coffee-bean-100 text-coffee-bean-700"
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

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
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

                      {story.status === "brouillon" ? (
                        <button
                          onClick={() => handlePublish(story._id, story.title)}
                          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium bg-seaweed-600 text-white hover:bg-seaweed-700 transition-colors"
                        >
                          📢 Publier
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleUnpublish(story._id, story.title)
                          }
                          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-md px-4 text-sm font-medium bg-coffee-bean-500 text-white hover:bg-coffee-bean-600 transition-colors"
                        >
                          📝 Retirer de la publication
                        </button>
                      )}
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
                    className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 placeholder:text-coffee-bean-400 focus:outline-none focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
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
                    className="flex w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 placeholder:text-coffee-bean-400 focus:outline-none focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent min-h-[120px]"
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
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 focus:outline-none focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                  >
                    <option value="">Choisir un thème</option>
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image de couverture */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Image de couverture
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="URL de l'image ou sélectionnez du catalogue"
                      value={newStory.coverImage}
                      onChange={(e) =>
                        setNewStory({ ...newStory, coverImage: e.target.value })
                      }
                      className="flex h-10 flex-1 rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 placeholder:text-coffee-bean-400 focus:outline-none focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImageCatalog(true)}
                      disabled={
                        !newStory.theme || selectedThemeImages.length === 0
                      }
                      className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium bg-neon-ice-600 text-white hover:bg-neon-ice-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Images className="h-4 w-4 mr-2" />
                      Catalogue
                    </button>
                  </div>
                  {newStory.coverImage && (
                    <div className="mt-2 relative w-32 h-20 rounded overflow-hidden border">
                      <img
                        src={newStory.coverImage}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Bouton proposer l'image pour le thème */}
                  {newStory.coverImage &&
                    newStory.theme &&
                    !isNaN(parseInt(newStory.theme)) && (
                      <SuggestImageButton
                        themeId={parseInt(newStory.theme)}
                        themeName={
                          themes.find((t) => t.id === parseInt(newStory.theme))
                            ?.name || "ce thème"
                        }
                        currentImageUrl={newStory.coverImage}
                        className="mt-2 w-full border-2 border-dashed border-seaweed-300 text-seaweed-600 hover:bg-seaweed-50 hover:border-seaweed-400"
                      />
                    )}
                  {newStory.theme && selectedThemeImages.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Aucune image dans le catalogue de ce thème. Entrez une URL
                      manuellement.
                    </p>
                  )}
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
                    className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 placeholder:text-coffee-bean-400 focus:outline-none focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
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
                    className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 focus:outline-none focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
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
                    className="flex-1 inline-flex items-center justify-center h-10 rounded-md px-4 text-sm font-medium bg-cherry-rose-500 text-white border border-cherry-rose-500 hover:bg-cherry-rose-600 hover:border-cherry-rose-600 transition-colors"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal du catalogue d'images */}
      {showImageCatalog && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Catalogue d'images -{" "}
                {themes.find((t) => t.id === parseInt(newStory.theme))?.name}
              </h3>
              <button
                onClick={() => setShowImageCatalog(false)}
                className="p-2 hover:bg-pale-sky-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {selectedThemeImages.length === 0 ? (
                <p className="text-center text-coffee-bean-500 py-8">
                  Aucune image disponible pour ce thème
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedThemeImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => handleSelectImage(image.image_url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                        newStory.coverImage === image.image_url
                          ? "border-neon-ice-600 ring-2 ring-neon-ice-300"
                          : "border-pale-sky-200 hover:border-neon-ice-400"
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.label || "Image"}
                        className="w-full h-full object-cover"
                      />
                      {image.label && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate">
                          {image.label}
                        </div>
                      )}
                      {newStory.coverImage === image.image_url && (
                        <div className="absolute top-2 right-2 bg-neon-ice-600 text-white rounded-full p-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
