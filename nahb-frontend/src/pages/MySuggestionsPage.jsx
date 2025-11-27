import { useState, useEffect } from "react";
import { imageSuggestionsAPI } from "../services/api";
import { Lightbulb, Clock, CheckCircle, XCircle, Image } from "lucide-react";

export default function MySuggestionsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const suggestionsRes = await imageSuggestionsAPI.getMy();
      setSuggestions(suggestionsRes.data.data || []);
    } catch (err) {
      console.error("Erreur chargement suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} />
            En attente
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} />
            Approuvée
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} />
            Refusée
          </span>
        );
      default:
        return null;
    }
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const stats = {
    total: suggestions.length,
    pending: suggestions.filter((s) => s.status === "pending").length,
    approved: suggestions.filter((s) => s.status === "approved").length,
    rejected: suggestions.filter((s) => s.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pale-sky-50 to-cherry-rose-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seaweed-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-sky-50 to-cherry-rose-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-coffee-bean-800 flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            Mes propositions d'images
          </h1>
          <p className="text-coffee-bean-600 mt-2">
            Suivez le statut de vos images proposées pour les thèmes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-coffee-bean-800">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-700">
              {stats.pending}
            </div>
            <div className="text-sm text-yellow-600">En attente</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
            <div className="text-2xl font-bold text-green-700">
              {stats.approved}
            </div>
            <div className="text-sm text-green-600">Approuvées</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
            <div className="text-2xl font-bold text-red-700">
              {stats.rejected}
            </div>
            <div className="text-sm text-red-600">Refusées</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: "all", label: "Toutes" },
            { value: "pending", label: "En attente" },
            { value: "approved", label: "Approuvées" },
            { value: "rejected", label: "Refusées" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-seaweed-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste des suggestions */}
        {filteredSuggestions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Aucune proposition
            </h3>
            <p className="text-gray-500">
              {filter === "all"
                ? "Vous n'avez pas encore proposé d'images. Proposez des images depuis l'éditeur d'histoire !"
                : `Aucune proposition avec le statut "${filter}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={suggestion.image_url}
                    alt="Suggestion"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                      e.target.parentElement.innerHTML =
                        '<span class="text-gray-400 text-sm">Image non disponible</span>';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(suggestion.status)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                      {suggestion.theme_name}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 truncate mb-2">
                    {suggestion.image_url}
                  </p>

                  <div className="text-xs text-gray-400">
                    Proposée le{" "}
                    {new Date(suggestion.created_at).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </div>

                  {suggestion.reviewed_at && (
                    <div className="text-xs text-gray-400 mt-1">
                      {suggestion.status === "approved"
                        ? "Approuvée"
                        : "Refusée"}{" "}
                      le{" "}
                      {new Date(suggestion.reviewed_at).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
