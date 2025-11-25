import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { storiesAPI, reviewsAPI, gameAPI, reportsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Star, Play, CheckCircle, GamepadIcon, Flag, X } from "lucide-react";

export default function StoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [existingSession, setExistingSession] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    loadStoryDetails();
  }, [id, user]);

  // Recharger quand on revient sur la page
  useEffect(() => {
    const handleFocus = () => {
      loadStoryDetails();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [id, user]);

  const loadStoryDetails = async () => {
    try {
      setLoading(true);
      const [storyRes, reviewsRes] = await Promise.all([
        storiesAPI.getById(id),
        reviewsAPI.getByStory(id),
      ]);

      setStory(storyRes.data.data);
      setReviews(reviewsRes.data.data);

      // Vérifier si une session en cours existe
      if (user) {
        try {
          const sessionsRes = await gameAPI.getMySessions();
          const sessions = sessionsRes.data.data;
          const activeSession = sessions.find(
            (s) => s.story_mongo_id === id && !s.is_completed
          );
          setExistingSession(activeSession || null);
        } catch (err) {
          setExistingSession(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async () => {
    try {
      if (existingSession) {
        // Reprendre la session existante
        navigate(`/read/${existingSession.id}`);
      } else {
        // Créer une nouvelle session
        const response = await gameAPI.start(id);
        const { sessionId } = response.data.data;
        navigate(`/read/${sessionId}`);
      }
    } catch (err) {
      alert(
        err.response?.data?.error || "Erreur lors du démarrage de la partie"
      );
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Vous devez être connecté pour laisser un avis");
      return;
    }

    try {
      setReviewLoading(true);
      await reviewsAPI.create({
        storyMongoId: id,
        rating,
        comment,
      });

      setComment("");
      setRating(5);
      loadStoryDetails();
      alert("Avis enregistré avec succès !");
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'envoi de l'avis");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Vous devez être connecté pour signaler");
      return;
    }

    if (!reportReason.trim()) {
      alert("Veuillez indiquer la raison du signalement");
      return;
    }

    try {
      setReportLoading(true);
      await reportsAPI.create({
        storyMongoId: id,
        reason: reportReason,
      });

      setReportReason("");
      setShowReportModal(false);
      alert("Signalement envoyé avec succès. Notre équipe va l'examiner.");
    } catch (err) {
      alert(
        err.response?.data?.error || "Erreur lors de l'envoi du signalement"
      );
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Histoire introuvable"}</p>
          <Link to="/stories" className="text-indigo-600 hover:text-indigo-800">
            Retour aux histoires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {story.coverImage && (
            <img
              src={story.coverImage}
              alt={story.title}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {story.title}
            </h1>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {story.theme && (
                <span className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-full">
                  {story.theme}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-gray-600">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {story.rating?.average?.toFixed(1) || "N/A"} (
                {story.rating?.count || 0} avis)
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <GamepadIcon className="w-4 h-4" />
                {story.stats?.totalPlays || 0} parties
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle className="w-4 h-4" />
                {story.stats?.totalCompletions || 0} complétions
              </span>
            </div>

            {story.tags && story.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {story.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {story.description || "Aucune description disponible"}
            </p>

            <div className="flex gap-3">
              {existingSession ? (
                <div className="flex-1 space-y-3">
                  <button
                    onClick={handlePlay}
                    className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" fill="white" />
                    Reprendre votre partie
                  </button>
                  <p className="text-sm text-gray-600 text-center">
                    Vous avez une partie en cours
                  </p>
                </div>
              ) : (
                <button
                  onClick={handlePlay}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" fill="white" />
                  Jouer maintenant
                </button>
              )}

              {user && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                  title="Signaler cette histoire"
                >
                  <Flag size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Avis */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Avis des lecteurs ({reviews.length})
          </h2>

          {/* Formulaire d'avis */}
          {user && (
            <form
              onSubmit={handleSubmitReview}
              className="mb-8 p-4 bg-gray-50 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-4">
                Laisser un avis
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Qu'avez-vous pensé de cette histoire ?"
                />
              </div>

              <button
                type="submit"
                disabled={reviewLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {reviewLoading ? "Envoi..." : "Publier mon avis"}
              </button>
            </form>
          )}

          {/* Liste des avis */}
          {reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Aucun avis pour le moment. Soyez le premier !
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        {review.pseudo}
                      </span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de signalement */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Signaler cette histoire
                </h2>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitReport}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du signalement *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Contenu inapproprié, violence, etc."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reportReason.length}/500 caractères
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                    disabled={reportLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    disabled={reportLoading}
                  >
                    {reportLoading ? "Envoi..." : "Signaler"}
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
