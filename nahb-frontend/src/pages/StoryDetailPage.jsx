import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storiesAPI, reviewsAPI, gameAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    loadStoryDetails();
  }, [id]);

  const loadStoryDetails = async () => {
    try {
      setLoading(true);
      const [storyRes, reviewsRes] = await Promise.all([
        storiesAPI.getById(id),
        reviewsAPI.getByStory(id),
      ]);

      setStory(storyRes.data.data);
      setReviews(reviewsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async () => {
    try {
      const response = await gameAPI.start(id);
      const { sessionId } = response.data.data;
      navigate(`/read/${sessionId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du démarrage de la partie');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Vous devez être connecté pour laisser un avis');
      return;
    }

    try {
      setReviewLoading(true);
      await reviewsAPI.create({
        storyMongoId: id,
        rating,
        comment,
      });

      setComment('');
      setRating(5);
      loadStoryDetails();
      alert('Avis enregistré avec succès !');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setReviewLoading(false);
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
          <p className="text-red-600 mb-4">{error || 'Histoire introuvable'}</p>
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

            <div className="flex items-center gap-4 mb-4">
              {story.theme && (
                <span className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-full">
                  {story.theme}
                </span>
              )}
              <span className="text-gray-600">
                ⭐ {story.rating?.average?.toFixed(1) || 'N/A'} ({story.rating?.count || 0} avis)
              </span>
              <span className="text-gray-600">
                🎮 {story.stats?.totalPlays || 0} parties
              </span>
              <span className="text-gray-600">
                ✅ {story.stats?.totalCompletions || 0} complétions
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
              {story.description || 'Aucune description disponible'}
            </p>

            <button
              onClick={handlePlay}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🎮 Jouer maintenant
            </button>
          </div>
        </div>

        {/* Avis */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Avis des lecteurs ({reviews.length})
          </h2>

          {/* Formulaire d'avis */}
          {user && (
            <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Laisser un avis</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
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
                {reviewLoading ? 'Envoi...' : 'Publier mon avis'}
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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {review.pseudo}
                      </span>
                      <span className="text-yellow-400">
                        {'⭐'.repeat(review.rating)}
                      </span>
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
    </div>
  );
}

