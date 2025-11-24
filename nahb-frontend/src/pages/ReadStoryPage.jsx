import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, pagesAPI } from '../services/api';

export default function ReadStoryPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [unlockedEndings, setUnlockedEndings] = useState([]);
  const [storyId, setStoryId] = useState(null);
  const [pathStats, setPathStats] = useState(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);

      const response = await gameAPI.getHistory(sessionId);
      const { session } = response.data.data;

      setIsCompleted(session.is_completed);
      setStoryId(session.story_mongo_id);

      if (session.story_mongo_id) {
        try {
          const endingsResponse = await gameAPI.getUnlockedEndings(session.story_mongo_id);
          setUnlockedEndings(endingsResponse.data.data || []);
        } catch (err) {
          console.log('Aucune fin débloquée');
          setUnlockedEndings([]);
        }
      }

      const pageResponse = await pagesAPI.getById(session.current_page_mongo_id);
      setCurrentPage(pageResponse.data.data);

    } catch (err) {
      console.error('Erreur chargement session:', err);
      setError(err.response?.data?.error || 'Session introuvable ou erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choiceId) => {
    try {
      setLoading(true);
      const response = await gameAPI.makeChoice(sessionId, choiceId);
      const { currentPage: nextPage, isCompleted: completed } = response.data.data;

      setCurrentPage(nextPage);
      setIsCompleted(completed);

      if (completed && storyId) {
        try {
          const endingsResponse = await gameAPI.getUnlockedEndings(storyId);
          setUnlockedEndings(endingsResponse.data.data || []);

          const statsResponse = await gameAPI.getPathStats(sessionId);
          setPathStats(statsResponse.data.data);
        } catch (err) {
          console.log('Erreur lors du chargement des stats');
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du choix');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    navigate('/stories');
  };

  if (loading && !currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/stories')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Retour aux histoires
          </button>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Aucune page à afficher</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fins débloquées */}
        {unlockedEndings.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg p-4 shadow-xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              🏆 Fins débloquées ({unlockedEndings.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unlockedEndings.map((ending, index) => (
                <span
                  key={index}
                  className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium"
                >
                  {ending.endLabel || `Fin ${index + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Illustration */}
        {currentPage.illustration && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-2xl">
            <img
              src={currentPage.illustration}
              alt="Illustration"
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Contenu de la page */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 shadow-2xl mb-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-line">
              {currentPage.content}
            </p>
          </div>
        </div>

        {/* Fin de l'histoire */}
        {isCompleted || currentPage.isEnd ? (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">
              🎉 {currentPage.endLabel || 'Fin'}
            </h2>
            <p className="text-lg mb-6">
              Vous avez terminé cette histoire !
            </p>

            {/* Statistiques de parcours */}
            {pathStats && (
              <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                <p className="text-lg font-bold mb-3">📊 Statistiques de parcours</p>

                <div className="space-y-3">
                  {/* Similarité du chemin */}
                  <div className="bg-white bg-opacity-10 rounded-lg p-3">
                    <p className="text-sm mb-1">🚶 Chemin pris</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {pathStats.pathSimilarity}% des joueurs
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      ont pris un chemin similaire au tien
                    </p>
                  </div>

                  {/* Stats de la fin */}
                  {pathStats.endStats && (
                    <div className="bg-white bg-opacity-10 rounded-lg p-3">
                      <p className="text-sm mb-1">🏁 Cette fin</p>
                      <p className="text-2xl font-bold text-green-400">
                        {pathStats.endStats.percentage}% des joueurs
                      </p>
                      <p className="text-xs opacity-75 mt-1">
                        ont atteint cette fin ({pathStats.endStats.timesReached} fois)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistiques des fins */}
            {unlockedEndings.length > 0 && (
              <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                <p className="text-sm mb-2">
                  🏆 Fins découvertes : {unlockedEndings.length}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {unlockedEndings.map((ending, index) => (
                    <span
                      key={index}
                      className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold"
                    >
                      {ending.endLabel || `Fin ${index + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={handleRestart}
                className="bg-white text-indigo-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Retour aux histoires
              </button>
            </div>
          </div>
        ) : (
          /* Choix disponibles */
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Que faites-vous ?
            </h3>
            {currentPage.choices && currentPage.choices.length > 0 ? (
              currentPage.choices.map((choice, index) => (
                <button
                  key={choice._id || index}
                  onClick={() => handleChoice(choice._id)}
                  disabled={loading}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-lg p-4 text-left transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-medium">
                    {choice.order !== undefined && `${choice.order + 1}. `}
                    {choice.text}
                  </span>
                  {choice.diceRequirement && (
                    <span className="ml-2 text-sm text-yellow-300">
                      🎲 Jet de dé requis: {choice.diceRequirement}+
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center text-gray-400">
                Aucun choix disponible
              </div>
            )}
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 px-6 py-4 rounded-lg shadow-xl">
              <p className="text-lg">Chargement...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

