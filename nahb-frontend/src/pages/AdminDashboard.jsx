import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminAPI, themesAPI, imageSuggestionsAPI } from "../services/api";
import { ImagePlus } from "lucide-react";
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

const TABS = [
  { id: "stats", label: "Statistiques" },
  { id: "users", label: "Utilisateurs" },
  { id: "stories", label: "Histoires" },
  { id: "reports", label: "Signalements" },
  { id: "themes", label: "Thèmes" },
  { id: "suggestions", label: "Suggestions", icon: ImagePlus },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [reports, setReports] = useState([]);
  const [themes, setThemes] = useState([]);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(null);

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

  // ==================== USERS ====================
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

  // ==================== STORIES ====================
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

  // ==================== REPORTS ====================
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
  const handleCreateTheme = async (themeForm) => {
    try {
      await themesAPI.create(themeForm);
      toast.success("Thème créé");
      setShowThemeModal(false);
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

  const handleOpenAddImage = (theme) => {
    setSelectedTheme(theme);
    setShowImageModal(true);
  };

  const handleAddImage = async (imageForm) => {
    if (!selectedTheme) return;
    try {
      await themesAPI.addImage(selectedTheme.id, imageForm);
      toast.success("Image ajoutée au catalogue");
      setShowImageModal(false);
      setSelectedTheme(null);
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

  // ==================== RENDER ====================
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "stats":
        return <StatsTab stats={stats} />;
      case "users":
        return (
          <UsersTab
            users={users}
            onBanUser={handleBanUser}
            onUnbanUser={handleUnbanUser}
          />
        );
      case "stories":
        return (
          <StoriesTab stories={stories} onSuspendStory={handleSuspendStory} />
        );
      case "reports":
        return (
          <ReportsTab reports={reports} onResolveReport={handleResolveReport} />
        );
      case "themes":
        return (
          <ThemesTab
            themes={themes}
            onCreateTheme={() => setShowThemeModal(true)}
            onDeleteTheme={handleDeleteTheme}
            onAddImage={handleOpenAddImage}
            onDeleteImage={handleDeleteImage}
          />
        );
      case "suggestions":
        return (
          <SuggestionsTab
            suggestions={imageSuggestions}
            onApproveSuggestion={handleApproveSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
          />
        );
      default:
        return null;
    }
  };

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
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      activeTab === tab.id
                        ? "bg-background text-foreground shadow-sm"
                        : ""
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 mr-1" />}
                    {tab.label}
                    {tab.id === "suggestions" &&
                      imageSuggestions.length > 0 && (
                        <span className="ml-1 bg-cherry-rose-500 text-white text-xs rounded-full px-1.5">
                          {imageSuggestions.length}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>

            {renderTabContent()}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onSubmit={handleCreateTheme}
      />

      <AddImageModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setSelectedTheme(null);
        }}
        onSubmit={handleAddImage}
        theme={selectedTheme}
      />
    </div>
  );
}
