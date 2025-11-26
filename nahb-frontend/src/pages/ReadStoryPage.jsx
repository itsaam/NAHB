import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameAPI, pagesAPI } from "../services/api";

export default function ReadStoryPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [unlockedEndings, setUnlockedEndings] = useState([]);
  const [storyId, setStoryId] = useState(null);
  const [pathStats, setPathStats] = useState(null);

  // État pour le système de dés
  const [showDiceModal, setShowDiceModal] = useState(false);
  const [pendingChoice, setPendingChoice] = useState(null);
  const [diceResult, setDiceResult] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

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
          const endingsResponse = await gameAPI.getUnlockedEndings(
            session.story_mongo_id
          );
          setUnlockedEndings(endingsResponse.data.data || []);
        } catch (err) {
          console.log("Aucune fin débloquée");
          setUnlockedEndings([]);
        }
      }

      const pageResponse = await pagesAPI.getById(
        session.current_page_mongo_id
      );
      setCurrentPage(pageResponse.data.data);
    } catch (err) {
      console.error("Erreur chargement session:", err);
      setError(
        err.response?.data?.error ||
          "Session introuvable ou erreur de chargement"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour lancer le dé avec animation
  const rollDice = () => {
    setIsRolling(true);
    setDiceResult(null);

    // Animation de roulement
    let rolls = 0;
    const maxRolls = 15;
    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 20) + 1);
      rolls++;
      if (rolls >= maxRolls) {
        clearInterval(interval);
        const finalResult = Math.floor(Math.random() * 20) + 1;
        setDiceResult(finalResult);
        setIsRolling(false);
      }
    }, 100);
  };

  // Fonction pour gérer le résultat du dé
  const handleDiceResult = async () => {
    if (!pendingChoice || diceResult === null) return;

    const isSuccess = diceResult >= pendingChoice.diceThreshold;

    if (isSuccess) {
      // Succès : aller à la page de destination normale
      await handleChoice(pendingChoice._id);
    } else if (pendingChoice.failurePageId) {
      // Échec avec page d'échec : aller à cette page
      await handleChoiceWithTargetPage(pendingChoice.failurePageId);
    }
    // Sinon : échec sans page d'échec, rester sur place

    setShowDiceModal(false);
    setPendingChoice(null);
    setDiceResult(null);
  };

  // Fonction pour naviguer vers une page spécifique (utilisée pour l'échec)
  const handleChoiceWithTargetPage = async (targetPageId) => {
    try {
      setLoading(true);
      const response = await gameAPI.makeChoiceWithTarget(
        sessionId,
        targetPageId
      );
      const { currentPage: nextPage, isCompleted: completed } =
        response.data.data;

      setCurrentPage(nextPage);
      setIsCompleted(completed);

      if (completed && storyId) {
        try {
          const endingsResponse = await gameAPI.getUnlockedEndings(storyId);
          setUnlockedEndings(endingsResponse.data.data || []);

          const statsResponse = await gameAPI.getPathStats(sessionId);
          setPathStats(statsResponse.data.data);
        } catch (err) {
          console.log("Erreur lors du chargement des stats");
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la navigation");
    } finally {
      setLoading(false);
    }
  };

  // Fonction appelée quand on clique sur un choix
  const onChoiceClick = (choice) => {
    console.log("🎲 Choix cliqué:", choice);
    console.log("🎲 diceRequired:", choice.diceRequired);

    if (choice.diceRequired) {
      console.log("🎲 Ouverture du modal de dé !");
      // Ouvrir le modal de jet de dé
      setPendingChoice(choice);
      setShowDiceModal(true);
      setDiceResult(null);
    } else {
      console.log("🎲 Pas de dé, navigation directe");
      // Pas de dé requis, navigation directe
      handleChoice(choice._id);
    }
  };

  const handleChoice = async (choiceId) => {
    try {
      setLoading(true);
      const response = await gameAPI.makeChoice(sessionId, choiceId);
      const { currentPage: nextPage, isCompleted: completed } =
        response.data.data;

      setCurrentPage(nextPage);
      setIsCompleted(completed);

      if (completed && storyId) {
        try {
          const endingsResponse = await gameAPI.getUnlockedEndings(storyId);
          setUnlockedEndings(endingsResponse.data.data || []);

          const statsResponse = await gameAPI.getPathStats(sessionId);
          setPathStats(statsResponse.data.data);
        } catch (err) {
          console.log("Erreur lors du chargement des stats");
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors du choix");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    navigate("/stories");
  };

  const handleSaveAndQuit = () => {
    navigate("/stories");
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
            onClick={() => navigate("/stories")}
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fins débloquées */}
        {unlockedEndings.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-4 shadow-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-white">
              🏆 Fins débloquées ({unlockedEndings.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unlockedEndings.map((ending, index) => (
                <span
                  key={index}
                  className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-900"
                >
                  {ending.endLabel || `Fin ${index + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Illustration */}
        {currentPage.illustration && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={currentPage.illustration}
              alt="Illustration"
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Contenu de la page */}
        <div className="bg-white rounded-lg p-8 shadow-lg mb-8 border border-gray-200">
          <div className="prose max-w-none">
            <p className="text-lg leading-relaxed whitespace-pre-line text-gray-900">
              {currentPage.content}
            </p>
          </div>
        </div>

        {/* Fin de l'histoire */}
        {isCompleted || currentPage.isEnd ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-lg border border-indigo-200">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              🎉 {currentPage.endLabel || "Fin"}
            </h2>
            <p className="text-lg mb-6 text-gray-700">
              Vous avez terminé cette histoire !
            </p>

            {/* Statistiques de parcours */}
            {pathStats && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-lg font-bold mb-3 text-gray-900">
                  📊 Statistiques de parcours
                </p>

                <div className="space-y-3">
                  {/* Similarité du chemin */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm mb-1 text-gray-600">🚶 Chemin pris</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {pathStats.pathSimilarity}% des joueurs
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ont pris un chemin similaire au tien
                    </p>
                  </div>

                  {/* Stats de la fin */}
                  {pathStats.endStats && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm mb-1 text-gray-600">🏁 Cette fin</p>
                      <p className="text-2xl font-bold text-green-600">
                        {pathStats.endStats.percentage}% des joueurs
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ont atteint cette fin ({pathStats.endStats.timesReached}{" "}
                        fois)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistiques des fins */}
            {unlockedEndings.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <p className="text-sm mb-2 text-gray-700">
                  🏆 Fins découvertes : {unlockedEndings.length}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {unlockedEndings.map((ending, index) => (
                    <span
                      key={index}
                      className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold"
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
                className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retour aux histoires
              </button>
            </div>
          </div>
        ) : (
          /* Choix disponibles */
          <div>
            {/* Bouton Sauvegarder & Quitter */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={handleSaveAndQuit}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                💾 Sauvegarder & Quitter
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">
              Que faites-vous ?
            </h3>
            <div className="space-y-4">
              {currentPage.choices && currentPage.choices.length > 0 ? (
                currentPage.choices.map((choice, index) => (
                  <button
                    key={choice._id || index}
                    onClick={() => onChoiceClick(choice)}
                    disabled={loading}
                    className="w-full bg-white hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-600 rounded-lg p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <span className="text-lg font-medium text-gray-900">
                      {choice.order !== undefined && `${choice.order + 1}. `}
                      {choice.text}
                    </span>
                    {choice.diceRequired && (
                      <span className="ml-2 text-sm text-orange-600 font-semibold">
                        🎲 Jet de dé requis: {choice.diceThreshold}+
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500 bg-white rounded-lg p-4 border border-gray-200">
                  Aucun choix disponible
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Jet de dé - Design moderne et sobre */}
        {showDiceModal && pendingChoice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full p-6 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-6">
                <p className="text-zinc-400 text-sm uppercase tracking-widest mb-1">
                  Test de compétence
                </p>
                <p className="text-white text-lg">
                  Objectif :{" "}
                  <span className="font-mono font-bold text-xl">
                    {pendingChoice.diceThreshold}
                  </span>
                  <span className="text-zinc-500 text-sm ml-1">/ 20</span>
                </p>
              </div>

              {/* Zone du dé */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-24 h-24 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                    diceResult === null
                      ? "bg-zinc-800 border-zinc-600"
                      : isRolling
                      ? "bg-zinc-800 border-zinc-500 animate-pulse"
                      : diceResult >= pendingChoice.diceThreshold
                      ? "bg-emerald-900/50 border-emerald-500"
                      : "bg-red-900/50 border-red-500"
                  }`}
                >
                  <span
                    className={`font-mono font-bold transition-all ${
                      diceResult === null
                        ? "text-4xl text-zinc-600"
                        : "text-5xl text-white"
                    }`}
                  >
                    {diceResult === null ? "?" : diceResult}
                  </span>
                </div>
              </div>

              {/* Barre de progression visuelle */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>1</span>
                  <span>20</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-600 rounded-full relative"
                    style={{
                      width: `${
                        ((pendingChoice.diceThreshold - 1) / 19) * 100
                      }%`,
                    }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-zinc-400"></div>
                  </div>
                  {diceResult !== null && !isRolling && (
                    <div
                      className={`h-full rounded-full -mt-2 transition-all duration-500 ${
                        diceResult >= pendingChoice.diceThreshold
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${(diceResult / 20) * 100}%` }}
                    ></div>
                  )}
                </div>
              </div>

              {/* Résultat */}
              {diceResult !== null && !isRolling && (
                <div
                  className={`text-center mb-6 py-3 rounded-lg ${
                    diceResult >= pendingChoice.diceThreshold
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      diceResult >= pendingChoice.diceThreshold
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {diceResult >= pendingChoice.diceThreshold
                      ? "Réussite"
                      : "Échec"}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {diceResult >= pendingChoice.diceThreshold
                      ? `${diceResult} ≥ ${pendingChoice.diceThreshold}`
                      : `${diceResult} < ${pendingChoice.diceThreshold}`}
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                {diceResult === null || isRolling ? (
                  <>
                    <button
                      onClick={() => {
                        setShowDiceModal(false);
                        setPendingChoice(null);
                      }}
                      className="flex-1 bg-zinc-800 text-zinc-400 font-medium py-3 px-4 rounded-lg hover:bg-zinc-700 hover:text-zinc-300 transition-colors border border-zinc-700"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={rollDice}
                      disabled={isRolling}
                      className="flex-1 bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {isRolling ? "..." : "Lancer"}
                    </button>
                  </>
                ) : (
                  <>
                    {diceResult < pendingChoice.diceThreshold &&
                      !pendingChoice.failurePageId && (
                        <button
                          onClick={() => setDiceResult(null)}
                          className="flex-1 bg-zinc-800 text-zinc-300 font-medium py-3 px-4 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                          Relancer
                        </button>
                      )}
                    <button
                      onClick={handleDiceResult}
                      className={`flex-1 font-semibold py-3 px-4 rounded-lg transition-colors ${
                        diceResult >= pendingChoice.diceThreshold
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      Continuer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
