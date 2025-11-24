import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'stats') {
        const response = await adminAPI.getStats();
        setStats(response.data.data);
      } else if (activeTab === 'users') {
        const response = await adminAPI.getUsers();
        setUsers(response.data.data);
      } else if (activeTab === 'stories') {
        const response = await adminAPI.getStories();
        setStories(response.data.data);
      } else if (activeTab === 'reports') {
        const response = await adminAPI.getReports();
        setReports(response.data.data);
      }
    } catch (err) {
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, currentlyBanned) => {
    try {
      if (currentlyBanned) {
        await adminAPI.unbanUser(userId);
        alert('Utilisateur débanni');
      } else {
        await adminAPI.banUser(userId);
        alert('Utilisateur banni');
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const handleSuspendStory = async (storyId, currentlySuspended) => {
    try {
      if (currentlySuspended) {
        await adminAPI.unsuspendStory(storyId);
        alert('Histoire réactivée');
      } else {
        await adminAPI.suspendStory(storyId);
        alert('Histoire suspendue');
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    try {
      await adminAPI.handleReport(reportId, action);
      alert(`Signalement ${action === 'resolved' ? 'résolu' : 'rejeté'}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          👑 Administration
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'stats'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Statistiques
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 Utilisateurs ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'stories'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📖 Histoires ({stories.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'reports'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚨 Signalements ({reports.length})
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : (
              <>
                {/* Stats Tab */}
                {activeTab === 'stats' && stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Utilisateurs totaux</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.users.total_users}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Auteurs: {stats.users.total_authors} | Lecteurs: {stats.users.total_readers}
                      </p>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Histoires</p>
                      <p className="text-3xl font-bold text-green-600">{stats.stories.total}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Publiées: {stats.stories.published} | Suspendues: {stats.stories.suspended}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Parties jouées</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.stories.totalPlays}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Complétées: {stats.stories.totalCompletions}
                      </p>
                    </div>

                    <div className="bg-yellow-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Reviews</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.reviews.total}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Moyenne: {stats.reviews.averageRating} ⭐
                      </p>
                    </div>

                    <div className="bg-red-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Signalements</p>
                      <p className="text-3xl font-bold text-red-600">{stats.reports.total_reports}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        En attente: {stats.reports.pending_reports}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-6 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Utilisateurs bannis</p>
                      <p className="text-3xl font-bold text-orange-600">{stats.users.banned_users}</p>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">ID</th>
                          <th className="text-left py-3 px-4">Pseudo</th>
                          <th className="text-left py-3 px-4">Email</th>
                          <th className="text-left py-3 px-4">Rôle</th>
                          <th className="text-left py-3 px-4">Statut</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.id}</td>
                            <td className="py-3 px-4">{user.pseudo}</td>
                            <td className="py-3 px-4 text-sm">{user.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'auteur' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {user.is_banned ? (
                                <span className="text-red-600 font-semibold">Banni</span>
                              ) : (
                                <span className="text-green-600">Actif</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleBanUser(user.id, user.is_banned)}
                                  className={`px-3 py-1 rounded text-sm ${
                                    user.is_banned
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  }`}
                                >
                                  {user.is_banned ? 'Débannir' : 'Bannir'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Stories Tab */}
                {activeTab === 'stories' && (
                  <div className="space-y-4">
                    {stories.map((story) => (
                      <div key={story._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{story.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{story.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>🎮 {story.stats?.totalPlays || 0} parties</span>
                              <span>⭐ {story.rating?.average?.toFixed(1) || 'N/A'}</span>
                              <span className={`font-semibold ${
                                story.status === 'publié' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {story.status}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSuspendStory(story._id, story.isSuspended)}
                            className={`ml-4 px-4 py-2 rounded text-sm font-medium ${
                              story.isSuspended
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-orange-600 text-white hover:bg-orange-700'
                            }`}
                          >
                            {story.isSuspended ? 'Réactiver' : 'Suspendre'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              Signalement #{report.id} - {new Date(report.created_at).toLocaleDateString()}
                            </p>
                            <p className="mt-2">{report.reason}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Histoire ID: {report.story_mongo_id}
                            </p>
                            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          {report.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleResolveReport(report.id, 'resolved')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Résoudre
                              </button>
                              <button
                                onClick={() => handleResolveReport(report.id, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p className="text-center text-gray-600 py-8">Aucun signalement</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

