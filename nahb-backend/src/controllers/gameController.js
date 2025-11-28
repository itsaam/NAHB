const gameSessionService = require("../services/gameSessionService");
const sessionPathService = require("../services/sessionPathService");
const unlockedEndingService = require("../services/unlockedEndingService");
const Story = require("../models/mongodb/Story");
const Page = require("../models/mongodb/Page");
const logger = require("../utils/logger");

/**
 * Démarrer une nouvelle partie (niveau 10/20)
 */
const startGame = async (req, res) => {
  try {
    const { storyMongoId } = req.body;
    const userId = req.user ? req.user.id : null;

    logger.info(
      `Démarrage d'une partie pour l'histoire ${storyMongoId}${
        userId ? ` par l'utilisateur ${userId}` : " (mode invité)"
      }`
    );

    const story = await Story.findById(storyMongoId);

    if (!story) {
      logger.warn(`Histoire introuvable : ${storyMongoId}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    if (story.status !== "publié" || story.isSuspended) {
      logger.warn(
        `Tentative de jouer à une histoire non disponible : ${storyMongoId}`
      );
      return res.status(403).json({
        success: false,
        error: "Cette histoire n'est pas disponible.",
      });
    }

    if (!story.startPageId) {
      logger.warn(`Histoire ${storyMongoId} sans page de départ`);
      return res.status(400).json({
        success: false,
        error: "Cette histoire n'a pas de page de départ définie.",
      });
    }

    const startPage = await Page.findById(story.startPageId);
    if (!startPage) {
      logger.warn(`Page de départ introuvable pour l'histoire ${storyMongoId}`);
      return res.status(400).json({
        success: false,
        error: "La page de départ de cette histoire est introuvable.",
      });
    }

    let session;
    if (userId) {
      console.log(
        `🔍 Recherche d'une session existante pour user ${userId} et story ${storyMongoId}`
      );

      const existingSession = await gameSessionService.findActiveSession(
        userId,
        storyMongoId
      );

      if (existingSession) {
        session = existingSession;
        console.log(
          `✅ REPRISE DE LA SESSION ${session.id} pour l'utilisateur ${userId}`
        );
        console.log(`📄 Page actuelle: ${session.current_page_mongo_id}`);

        const currentPage = await Page.findById(session.current_page_mongo_id);

        if (!currentPage) {
          console.log(
            `❌ Page actuelle introuvable: ${session.current_page_mongo_id}`
          );
        } else {
          console.log(
            `✅ Page chargée: ${currentPage.content.substring(0, 50)}...`
          );
        }

        return res.status(200).json({
          success: true,
          data: {
            sessionId: session.id,
            storyId: storyMongoId,
            currentPage: currentPage,
            resumed: true,
          },
        });
      } else {
        logger.info(
          `🆕 Aucune session en cours trouvée, création d'une nouvelle session`
        );
      }
    } else {
      logger.warn(
        `⚠️ Pas d'utilisateur connecté (userId: ${userId}), création d'une nouvelle session`
      );
    }

    session = await gameSessionService.create({
      userId,
      storyMongoId,
      currentPageMongoId: story.startPageId.toString(),
      isPreview: false,
    });

    story.stats.totalPlays += 1;
    await story.save();

    startPage.stats.timesReached += 1;
    await startPage.save();

    logger.info(`Partie créée avec succès : session ${session.id}`);

    return res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        storyId: storyMongoId,
        currentPage: startPage,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors du démarrage de la partie : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors du démarrage de la partie.",
    });
  }
};

/**
 * Faire un choix et naviguer (niveau 10/20)
 */
const makeChoice = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { choiceId } = req.body;

    logger.info(`Choix ${choiceId} fait dans la session ${sessionId}`);

    const session = await gameSessionService.findById(sessionId);

    if (!session) {
      logger.warn(`Session introuvable : ${sessionId}`);
      return res.status(404).json({
        success: false,
        error: "Session de jeu introuvable.",
      });
    }

    // Vérifier que la session n'est pas terminée
    if (session.is_completed) {
      logger.warn(`Tentative de jouer sur une session terminée : ${sessionId}`);
      return res.status(400).json({
        success: false,
        error: "Cette partie est déjà terminée.",
      });
    }

    // Récupérer la page actuelle
    const currentPage = await Page.findById(session.current_page_mongo_id);

    if (!currentPage) {
      logger.error(
        `Page actuelle introuvable : ${session.current_page_mongo_id}`
      );
      return res.status(500).json({
        success: false,
        error: "Page actuelle introuvable.",
      });
    }

    const choice = currentPage.choices.find(
      (c) => c._id.toString() === choiceId
    );

    if (!choice) {
      logger.warn(`Choix invalide ${choiceId} pour la page ${currentPage._id}`);
      return res.status(400).json({
        success: false,
        error: "Choix invalide pour cette page.",
      });
    }

    const targetPage = await Page.findById(choice.targetPageId);

    if (!targetPage) {
      logger.error(`Page cible introuvable : ${choice.targetPageId}`);
      return res.status(500).json({
        success: false,
        error: "Page cible introuvable.",
      });
    }

    await sessionPathService.addStep(
      sessionId,
      currentPage._id.toString(),
      choiceId
    );

    let isCompleted = targetPage.isEnd;
    let endPageMongoId = isCompleted ? targetPage._id.toString() : null;

    logger.info(`💾 Mise à jour de la session ${sessionId}`);
    logger.info(`📄 Nouvelle page: ${targetPage._id.toString()}`);
    logger.info(`✅ Terminée: ${isCompleted}`);

    await gameSessionService.updateCurrentPage(sessionId, {
      currentPageMongoId: targetPage._id.toString(),
      isCompleted,
      endPageMongoId,
    });

    logger.info(`✅ Session ${sessionId} mise à jour avec succès`);

    targetPage.stats.timesReached += 1;
    if (targetPage.isEnd) {
      targetPage.stats.timesCompleted += 1;

      await Story.findByIdAndUpdate(targetPage.storyId, {
        $inc: { "stats.totalCompletions": 1 },
      });

      if (req.user) {
        await unlockedEndingService.unlock(
          req.user.id,
          targetPage.storyId.toString(),
          targetPage._id.toString()
        );
      }
    }
    await targetPage.save();

    logger.info(`Choix traité avec succès, navigation vers ${targetPage._id}`);

    return res.status(200).json({
      success: true,
      data: {
        currentPage: targetPage,
        isCompleted,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors du traitement du choix : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors du traitement du choix.",
    });
  }
};

/**
 * Récupérer l'historique d'une session
 */
const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info(`Récupération de l'historique de la session ${sessionId}`);

    const session = await gameSessionService.findById(sessionId);

    if (!session) {
      logger.warn(`Session introuvable : ${sessionId}`);
      return res.status(404).json({
        success: false,
        error: "Session introuvable.",
      });
    }

    const path = await sessionPathService.getBySession(sessionId);

    logger.info(`Historique récupéré : ${path.length} étapes`);

    return res.status(200).json({
      success: true,
      data: {
        session,
        path,
      },
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération de l'historique : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération de l'historique.",
    });
  }
};

/**
 * Récupérer les sessions de l'utilisateur
 */
const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Récupération des sessions de l'utilisateur ${userId}`);

    const sessions = await gameSessionService.findByUser(userId);

    logger.info(
      `${sessions.length} sessions trouvées pour l'utilisateur ${userId}`
    );

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des sessions : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des sessions.",
    });
  }
};

/**
 * Obtenir les statistiques de parcours pour une session
 */
const getPathStats = async (req, res) => {
  try {
    const { sessionId } = req.params;

    logger.info(`Récupération des stats de parcours pour session ${sessionId}`);

    const session = await gameSessionService.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session introuvable.",
      });
    }

    const currentPath = await sessionPathService.getBySession(sessionId);
    const currentPathPageIds = currentPath.map((r) => r.page_mongo_id);

    const allPaths = await sessionPathService.getAllPathsByStory(
      session.story_mongo_id
    );

    // Organiser par session
    const sessionPaths = {};
    allPaths.forEach((row) => {
      if (!sessionPaths[row.session_id]) {
        sessionPaths[row.session_id] = [];
      }
      sessionPaths[row.session_id].push(row.page_mongo_id);
    });

    let totalSessions = Object.keys(sessionPaths).length;
    let similarSessions = 0;

    Object.values(sessionPaths).forEach((path) => {
      const minLength = Math.min(currentPathPageIds.length, path.length);
      let matches = 0;

      for (let i = 0; i < minLength; i++) {
        if (currentPathPageIds[i] === path[i]) {
          matches++;
        }
      }

      if (minLength > 0 && matches / minLength >= 0.7) {
        similarSessions++;
      }
    });

    const similarityPercentage =
      totalSessions > 0
        ? Math.round((similarSessions / totalSessions) * 100)
        : 0;

    let endStats = null;
    if (session.is_completed && session.end_page_mongo_id) {
      const stats = await unlockedEndingService.getEndingStats(
        session.story_mongo_id,
        session.end_page_mongo_id
      );

      endStats = {
        endPageId: session.end_page_mongo_id,
        timesReached: stats.timesReached,
        percentage: stats.percentage,
      };
    }

    logger.info(`Stats calculées: ${similarityPercentage}% similarité`);

    return res.status(200).json({
      success: true,
      data: {
        pathSimilarity: similarityPercentage,
        totalSessions: totalSessions,
        endStats: endStats,
      },
    });
  } catch (err) {
    logger.error(`Erreur stats parcours: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du calcul des statistiques.",
    });
  }
};

const getUnlockedEndings = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    logger.info(
      `Récupération des fins débloquées pour l'histoire ${storyId} par ${userId}`
    );

    const unlockedEndings = await unlockedEndingService.getByUserAndStory(
      userId,
      storyId
    );

    const pageIds = unlockedEndings.map((e) => e.page_mongo_id);
    const pages = await Page.find({
      _id: { $in: pageIds },
      isEnd: true,
    }).select("_id endLabel illustration stats");

    const endingsWithDetails = unlockedEndings.map((ending) => {
      const page = pages.find((p) => p._id.toString() === ending.page_mongo_id);
      return {
        pageId: ending.page_mongo_id,
        endLabel: page?.endLabel || "Fin sans titre",
        illustration: page?.illustration || "",
        timesCompleted: page?.stats.timesCompleted || 0,
        unlockedAt: ending.unlocked_at,
      };
    });

    logger.info(
      `${endingsWithDetails.length} fins débloquées trouvées pour ${userId}`
    );

    return res.status(200).json({
      success: true,
      data: endingsWithDetails,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des fins débloquées : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des fins débloquées.",
    });
  }
};

/**
 * Récupérer les activités de l'utilisateur (histoires terminées et en cours)
 */
const getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Récupération des activités de l'utilisateur ${userId}`);

    // Récupérer toutes les sessions de l'utilisateur
    const sessionsData = await gameSessionService.getUserActivities(userId);

    // Organiser les données par histoire
    const storiesMap = {};

    for (const row of sessionsData) {
      const storyId = row.story_mongo_id;

      if (!storiesMap[storyId]) {
        storiesMap[storyId] = {
          storyId: storyId,
          completed: false,
          inProgress: false,
          endingsReached: 0,
          lastSessionId: null,
          lastUpdated: null,
        };
      }

      if (row.is_completed) {
        storiesMap[storyId].completed = true;
        storiesMap[storyId].endingsReached = parseInt(row.unique_endings) || 0;
      } else {
        storiesMap[storyId].inProgress = true;
        storiesMap[storyId].lastSessionId = row.last_session_id;
        storiesMap[storyId].lastUpdated = row.last_updated;
      }
    }

    // Récupérer les informations des histoires depuis MongoDB
    const storyIds = Object.keys(storiesMap);
    const stories = await Story.find({ _id: { $in: storyIds } }).select(
      "_id title description theme"
    );

    // Construire la réponse
    const activities = Object.values(storiesMap).map((activity) => {
      const story = stories.find((s) => s._id.toString() === activity.storyId);

      return {
        story: {
          id: activity.storyId,
          title: story?.title || "Histoire inconnue",
          description: story?.description || "",
          theme: story?.theme || "",
        },
        completed: activity.completed,
        progress: activity.completed ? 100 : activity.inProgress ? 50 : 0,
        endingsReached: activity.endingsReached,
        lastSessionId: activity.lastSessionId,
      };
    });

    logger.info(`${activities.length} activités trouvées pour ${userId}`);

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des activités : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des activités.",
    });
  }
};

/**
 * Naviguer directement vers une page (utilisé pour les échecs de jet de dé)
 */
const navigateToPage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { targetPageId } = req.body;

    logger.info(
      `Navigation directe vers la page ${targetPageId} dans la session ${sessionId}`
    );

    const session = await gameSessionService.findById(sessionId);

    if (!session) {
      logger.warn(`Session introuvable : ${sessionId}`);
      return res.status(404).json({
        success: false,
        error: "Session de jeu introuvable.",
      });
    }

    if (session.is_completed) {
      logger.warn(
        `Tentative de navigation sur une session terminée : ${sessionId}`
      );
      return res.status(400).json({
        success: false,
        error: "Cette partie est déjà terminée.",
      });
    }

    const targetPage = await Page.findById(targetPageId);

    if (!targetPage) {
      logger.error(`Page cible introuvable : ${targetPageId}`);
      return res.status(404).json({
        success: false,
        error: "Page cible introuvable.",
      });
    }

    // Vérifier que la page appartient à la même histoire
    if (targetPage.storyId.toString() !== session.story_mongo_id) {
      logger.warn(
        `Page ${targetPageId} n'appartient pas à l'histoire ${session.story_mongo_id}`
      );
      return res.status(400).json({
        success: false,
        error: "La page cible n'appartient pas à cette histoire.",
      });
    }

    let isCompleted = targetPage.isEnd;
    let endPageMongoId = isCompleted ? targetPage._id.toString() : null;

    await gameSessionService.updateCurrentPage(sessionId, {
      currentPageMongoId: targetPage._id.toString(),
      isCompleted,
      endPageMongoId,
    });

    targetPage.stats.timesReached += 1;
    if (targetPage.isEnd) {
      targetPage.stats.timesCompleted += 1;

      await Story.findByIdAndUpdate(targetPage.storyId, {
        $inc: { "stats.totalCompletions": 1 },
      });

      if (req.user) {
        await unlockedEndingService.unlock(
          req.user.id,
          targetPage.storyId.toString(),
          targetPage._id.toString()
        );
      }
    }
    await targetPage.save();

    logger.info(`Navigation directe effectuée vers ${targetPage._id}`);

    return res.status(200).json({
      success: true,
      data: {
        currentPage: targetPage,
        isCompleted,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors de la navigation directe : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la navigation.",
    });
  }
};

module.exports = {
  startGame,
  makeChoice,
  getSessionHistory,
  getMySessions,
  getUnlockedEndings,
  getPathStats,
  getMyActivities,
  navigateToPage,
};
