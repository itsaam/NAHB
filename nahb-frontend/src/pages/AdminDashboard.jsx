import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminAPI } from "../services/api";
import { Users, BookOpen, PlayCircle, Star, Flag, Ban, PenOff, MessageSquareOff } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);

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
        toast.warning("Signalement traité - Histoire suspendue automatiquement (5+ signalements)");
      } else {
        toast.success(`Signalement ${action === "resolved" ? "accepté" : "rejeté"}`);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
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
                                          onClick={() => handleUnbanUser(user.id)}
                                          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-9 rounded-md px-3 border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                                        >
                                          Débannir
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleBanUser(user.id, "full")}
                                            className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-destructive text-destructive bg-background transition-colors hover:bg-destructive hover:text-white"
                                            title="Ban complet"
                                          >
                                            <Ban className="h-3 w-3" />
                                            Ban
                                          </button>
                                          {user.role === "auteur" && (
                                            <button
                                              onClick={() => handleBanUser(user.id, "author")}
                                              className="inline-flex items-center gap-1 justify-center whitespace-nowrap text-xs font-medium h-8 rounded-md px-2 border border-orange-500 text-orange-500 bg-background transition-colors hover:bg-orange-500 hover:text-white"
                                              title="Interdit de créer des histoires"
                                            >
                                              <PenOff className="h-3 w-3" />
                                              Auteur
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleBanUser(user.id, "comment")}
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
                                <span>🎮 {story.stats?.totalPlays || 0}</span>
                                <span>
                                  ⭐{" "}
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
                                      ? "bg-yellow-100 text-yellow-800"
                                      : report.status === "resolved"
                                      ? "bg-green-100 text-green-800"
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
