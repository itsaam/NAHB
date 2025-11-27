import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminAPI, themesAPI, imageSuggestionsAPI } from "../services/api";
import {
  Users,
  BookOpen,
  PlayCircle,
  Star,
  Flag,
  Ban,
  PenOff,
  MessageSquareOff,
  Gamepad2,
  Palette,
  Plus,
  Trash2,
  Image,
  ImagePlus,
  Check,
  X,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [reports, setReports] = useState([]);
  const [themes, setThemes] = useState([]);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);

  // Modal state pour thèmes
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themeForm, setThemeForm] = useState({
    name: "",
    description: "",
    default_image: "",
  });
  const [imageForm, setImageForm] = useState({ image_url: "", alt_text: "" });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "stats") {
        const response = await adminAPI.getStats();
        setStats(response.data.data);
      } else if (activeTab === "users") {
        const response = await adminAPI.getUsers();
        setUsers(response.data.data);
      } else if (activeTab === "stories") {
        const response = await adminAPI.getStories();
        setStories(response.data.data);
      } else if (activeTab === "reports") {
        const response = await adminAPI.getReports();
        setReports(response.data.data);
      } else if (activeTab === "themes") {
        const response = await themesAPI.getAll();
        setThemes(response.data.data);
      } else if (activeTab === "suggestions") {
        const response = await imageSuggestionsAPI.getAll({
          status: "pending",
        });
        setImageSuggestions(response.data.data);
      }
    } catch (err) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, banType, reason = "") => {
    try {
      await adminAPI.banUser(userId, banType, reason);
      const banLabels = {
        full: "complètement banni",
        author: "interdit de créer des histoires",
        comment: "interdit de commenter",
      };
      toast.success(`Utilisateur ${banLabels[banType]}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors du bannissement");
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminAPI.unbanUser(userId);
      toast.success("Utilisateur débanni");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors du débannissement");
    }
  };

  const handleSuspendStory = async (storyId, isSuspended) => {
    try {
      if (isSuspended) {
        await adminAPI.unsuspendStory(storyId);
        toast.success("Histoire réactivée");
      } else {
        await adminAPI.suspendStory(storyId);
        toast.success("Histoire suspendue");
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      const response = await adminAPI.handleReport(reportId, action);
      if (response.data.data.storySuspended) {
        toast.warning(
          "Signalement traité - Histoire suspendue automatiquement (5+ signalements)"
        );
      } else {
        toast.success(
          `Signalement ${action === "resolved" ? "accepté" : "rejeté"}`
        );
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  // ==================== THEMES ====================
  const handleCreateTheme = async (e) => {
    e.preventDefault();
    try {
      await themesAPI.create(themeForm);
      toast.success("Thème créé");
      setShowThemeModal(false);
      setThemeForm({ name: "", description: "", default_image: "" });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  const handleDeleteTheme = async (themeId) => {
    if (!confirm("Supprimer ce thème et toutes ses images ?")) return;
    try {
      await themesAPI.delete(themeId);
      toast.success("Thème supprimé");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!selectedTheme) return;
    try {
      await themesAPI.addImage(selectedTheme.id, imageForm);
      toast.success("Image ajoutée au catalogue");
      setShowImageModal(false);
      setImageForm({ image_url: "", alt_text: "" });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await themesAPI.deleteImage(imageId);
      toast.success("Image supprimée");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    }
  };

  // ==================== IMAGE SUGGESTIONS ====================
  const handleApproveSuggestion = async (suggestionId) => {
    try {
      await imageSuggestionsAPI.approve(suggestionId);
      toast.success("Image approuvée et ajoutée au catalogue !");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'approbation");
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      await imageSuggestionsAPI.reject(suggestionId);
      toast.success("Image refusée");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors du refus");
    }
  };

  const statCards = stats
    ? [
        {
          label: "Utilisateurs",
          value: stats.users.total_users,
          icon: Users,
          color: "text-primary",
        },
        {
          label: "Histoires",
          value: stats.stories.total,
          icon: BookOpen,
          color: "text-accent",
        },
        {
          label: "Parties jouées",
          value: stats.stories.totalPlays,
          icon: PlayCircle,
          color: "text-primary",
        },
        {
          label: "Avis",
          value: stats.reviews.total,
          icon: Star,
          color: "text-accent",
        },
        {
          label: "Signalements",
          value: stats.reports.total_reports,
          icon: Flag,
          color: "text-destructive",
        },
        {
          label: "Utilisateurs bannis",
          value: stats.users.banned_users,
          icon: Ban,
          color: "text-muted-foreground",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard Administrateur</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Gérez la plateforme et modérez le contenu
            </p>
          </div>

          {/* Tabs */}
          <div className="space-y-8">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setActiveTab("stats")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === "stats"
                    ? "bg-background text-foreground shadow-sm"
                    : ""
                }`}
              >
                Statistiques
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === "users"
                    ? "bg-background text-foreground shadow-sm"
                    : ""
                }`}
              >
                Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab("stories")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === "stories"
                    ? "bg-background text-foreground shadow-sm"
                    : ""
                }`}
              >
                Histoires
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === "reports"
                    ? "bg-background text-foreground shadow-sm"
                    : ""
                }`}
              >
                Signalements
              </button>
              <button
                onClick={() => setActiveTab("themes")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === "themes"
                    ? "bg-background text-foreground shadow-sm"
                    : ""
                }`}
              >
                Thèmes
              </button>
              <button
                onClick={() => setActiveTab("suggestions")}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === "suggestions"
                    ? "bg-background text-foreground shadow-sm"
                    : ""
                }`}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                Suggestions
                {imageSuggestions.length > 0 && (
                  <span className="ml-1 bg-cherry-rose-500 text-white text-xs rounded-full px-1.5">
                    {imageSuggestions.length}
                  </span>
                )}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Stats Tab */}
                {activeTab === "stats" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
                        >
                          <div className="p-6 flex flex-row items-center justify-between pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
                              {stat.label}
                            </h3>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <div className="p-6 pt-0">
                            <div className="text-3xl font-bold">
                              {stat.value}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">
                        Gestion des utilisateurs
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Modérez les comptes utilisateurs
                      </p>
                    </div>
                    <div className="p-6 pt-0">
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                          <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors">
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Nom d'utilisateur
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Email
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Rôle
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Statut
                              </th>
                              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="[&_tr:last-child]:border-0">
                            {users.map((user) => (
                              <tr
                                key={user.id}
                                className="border-b transition-colors hover:bg-muted/50"
                              >
                                <td className="p-4 align-middle font-medium">
                                  {user.pseudo}
                                </td>
                                <td className="p-4 align-middle">
                                  {user.email}
                                </td>
                                <td className="p-4 align-middle">
                                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    {user.role}
                                  </span>
                                </td>
                                <td className="p-4 align-middle">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      user.is_banned
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {user.is_banned
                                      ? user.ban_type === "full"
                                        ? "Banni"
                                        : user.ban_type === "author"
                                        ? "Ban Auteur"
                                        : "Ban Commentaire"
                                      : "Actif"}
                                  </span>
                                </td>
                                <td className="p-4 align-middle">
                                  {user.role !== "admin" && (
                                    <div className="flex gap-2 flex-wrap">
                                      {user.is_banned ? (
                                        <button
                                          onClick={() =>
                                            handleUnbanUser(user.id)
                                          }
                                          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-9 rounded-md px-3 border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                                        >
                                          Débannir
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleBanUser(user.id, "full")
                                            }
                                            className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-destructive text-destructive bg-background transition-colors hover:bg-destructive hover:text-white"
                                            title="Ban complet"
                                          >
                                            <Ban className="h-3 w-3" />
                                            Ban
                                          </button>
                                          {user.role === "auteur" && (
                                            <button
                                              onClick={() =>
                                                handleBanUser(user.id, "author")
                                              }
                                              className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-orange-500 text-orange-500 bg-background transition-colors hover:bg-orange-500 hover:text-white"
                                              title="Interdit de créer des histoires"
                                            >
                                              <PenOff className="h-3 w-3" />
                                              Auteur
                                            </button>
                                          )}
                                          <button
                                            onClick={() =>
                                              handleBanUser(user.id, "comment")
                                            }
                                            className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-yellow-500 text-yellow-500 bg-background transition-colors hover:bg-yellow-500 hover:text-white"
                                            title="Interdit de commenter"
                                          >
                                            <MessageSquareOff className="h-3 w-3" />
                                            Commentaire
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stories Tab */}
                {activeTab === "stories" && (
                  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">
                        Gestion des histoires
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Modérez le contenu publié
                      </p>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      {stories.map((story) => (
                        <div
                          key={story._id}
                          className="rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">
                                {story.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {story.description}
                              </p>
                              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Gamepad2 className="w-4 h-4" />
                                  {story.stats?.totalPlays || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  {story.rating?.average?.toFixed(1) || "N/A"}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    story.status === "publié"
                                      ? "text-primary"
                                      : "text-accent"
                                  }`}
                                >
                                  {story.status}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleSuspendStory(story._id, story.isSuspended)
                              }
                              className={`ml-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 ${
                                story.isSuspended
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "bg-destructive text-destructive-foreground hover:opacity-90"
                              } transition-opacity`}
                            >
                              {story.isSuspended ? "Réactiver" : "Suspendre"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reports Tab */}
                {activeTab === "reports" && (
                  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">
                        Signalements
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Traitez les signalements de contenu
                      </p>
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                      {reports.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Aucun signalement
                        </p>
                      ) : (
                        reports.map((report) => (
                          <div
                            key={report.id}
                            className="rounded-lg border border-border p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                  Signalement #{report.id} -{" "}
                                  {new Date(
                                    report.created_at
                                  ).toLocaleDateString()}
                                </p>
                                <p className="mt-2">{report.reason}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Histoire ID: {report.story_mongo_id}
                                </p>
                                <span
                                  className={`inline-flex items-center rounded-full mt-2 px-2.5 py-0.5 text-xs font-semibold ${
                                    report.status === "pending"
                                      ? "bg-coffee-bean-100 text-coffee-bean-700"
                                      : report.status === "resolved"
                                      ? "bg-seaweed-100 text-seaweed-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {report.status}
                                </span>
                              </div>
                              {report.status === "pending" && (
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() =>
                                      handleResolveReport(report.id, "resolved")
                                    }
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                  >
                                    Résoudre
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleResolveReport(report.id, "rejected")
                                    }
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                                  >
                                    Rejeter
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Themes Tab */}
                {activeTab === "themes" && (
                  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">
                          Gestion des thèmes
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          Gérez les thèmes et le catalogue d'images
                        </p>
                      </div>
                      <button
                        onClick={() => setShowThemeModal(true)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        <Plus className="w-4 h-4" />
                        Nouveau thème
                      </button>
                    </div>
                    <div className="p-6 pt-0 space-y-6">
                      {themes.map((theme) => (
                        <div
                          key={theme.id}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                {theme.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {theme.description || "Aucune description"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedTheme(theme);
                                  setShowImageModal(true);
                                }}
                                className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                <Image className="w-4 h-4" />
                                Ajouter image
                              </button>
                              <button
                                onClick={() => handleDeleteTheme(theme.id)}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Catalogue d'images du thème */}
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">
                              Catalogue ({theme.images?.length || 0} images)
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {theme.images?.map((img) => (
                                <div
                                  key={img.id}
                                  className="relative group rounded-lg overflow-hidden aspect-video bg-muted"
                                >
                                  <img
                                    src={img.image_url}
                                    alt={img.alt_text || "Image"}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => handleDeleteImage(img.id)}
                                    className="absolute top-1 right-1 p-1 rounded bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {(!theme.images || theme.images.length === 0) && (
                                <p className="col-span-full text-sm text-muted-foreground">
                                  Aucune image dans ce thème
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions Tab */}
                {activeTab === "suggestions" && (
                  <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">
                        Suggestions d'images
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Images proposées par les utilisateurs pour les thèmes
                      </p>
                    </div>
                    <div className="p-6 pt-0">
                      {imageSuggestions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <ImagePlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune suggestion en attente</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imageSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="rounded-lg border border-border overflow-hidden bg-background"
                            >
                              <div className="aspect-video bg-muted">
                                <img
                                  src={suggestion.image_url}
                                  alt="Suggestion"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {suggestion.theme_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      suggestion.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Proposé par{" "}
                                  <span className="font-medium text-foreground">
                                    {suggestion.user_pseudo}
                                  </span>
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleApproveSuggestion(suggestion.id)
                                    }
                                    className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-seaweed-500 text-white hover:bg-seaweed-600 transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                    Approuver
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRejectSuggestion(suggestion.id)
                                    }
                                    className="flex-1 inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                                  >
                                    <X className="w-4 h-4" />
                                    Refuser
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Créer un thème */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Nouveau thème</h2>
            <form onSubmit={handleCreateTheme}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom du thème *
                  </label>
                  <input
                    type="text"
                    required
                    value={themeForm.name}
                    onChange={(e) =>
                      setThemeForm({ ...themeForm, name: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Ex: fantastique"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={themeForm.description}
                    onChange={(e) =>
                      setThemeForm({
                        ...themeForm,
                        description: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Description du thème"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image par défaut (URL)
                  </label>
                  <input
                    type="url"
                    value={themeForm.default_image}
                    onChange={(e) =>
                      setThemeForm({
                        ...themeForm,
                        default_image: e.target.value,
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowThemeModal(false)}
                  className="flex-1 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajouter une image */}
      {showImageModal && selectedTheme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-coffee-bean-900">
              Ajouter une image à "{selectedTheme.name}"
            </h2>
            <form onSubmit={handleAddImage}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-coffee-bean-700">
                    URL de l'image *
                  </label>
                  <input
                    type="url"
                    required
                    value={imageForm.image_url}
                    onChange={(e) =>
                      setImageForm({ ...imageForm, image_url: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-coffee-bean-700">
                    Texte alternatif
                  </label>
                  <input
                    type="text"
                    value={imageForm.alt_text}
                    onChange={(e) =>
                      setImageForm({ ...imageForm, alt_text: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-pale-sky-300 bg-white px-3 py-2 text-sm text-coffee-bean-900 focus:ring-2 focus:ring-cherry-rose-500 focus:border-transparent"
                    placeholder="Description de l'image"
                  />
                </div>
                {imageForm.image_url && (
                  <div className="rounded-lg overflow-hidden bg-pale-sky-100 aspect-video">
                    <img
                      src={imageForm.image_url}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(false);
                    setSelectedTheme(null);
                  }}
                  className="flex-1 h-10 px-4 rounded-md border border-pale-sky-300 bg-white text-coffee-bean-700 hover:bg-pale-sky-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 px-4 rounded-md bg-cherry-rose-500 text-white hover:bg-cherry-rose-600 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
