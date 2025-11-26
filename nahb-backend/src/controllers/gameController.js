const { pool } = require("../config/postgresql");
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

      const existingSession = await pool.query(
        `SELECT * FROM game_sessions 
         WHERE user_id = $1 AND story_mongo_id = $2 AND is_completed = false 
         ORDER BY updated_at DESC LIMIT 1`,
        [userId, storyMongoId]
      );

      console.log(`📊 Sessions trouvées: ${existingSession.rows.length}`);

      if (existingSession.rows.length > 0) {
        session = existingSession.rows[0];
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

    const result = await pool.query(
      `INSERT INTO game_sessions (user_id, story_mongo_id, current_page_mongo_id, is_preview) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, user_id, story_mongo_id, current_page_mongo_id, is_completed, started_at`,
      [userId, storyMongoId, story.startPageId.toString(), false]
    );

    session = result.rows[0];

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

    const sessionResult = await pool.query(
      "SELECT * FROM game_sessions WHERE id = $1",
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      logger.warn(`Session introuvable : ${sessionId}`);
      return res.status(404).json({
        success: false,
        error: "Session de jeu introuvable.",
      });
    }

    const session = sessionResult.rows[0];

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

    await pool.query(
      `INSERT INTO session_paths (session_id, page_mongo_id, choice_mongo_id, step_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(step_order), 0) + 1 FROM session_paths WHERE session_id = $1))`,
      [sessionId, currentPage._id.toString(), choiceId]
    );

    let isCompleted = targetPage.isEnd;
    let endPageMongoId = isCompleted ? targetPage._id.toString() : null;

    logger.info(`💾 Mise à jour de la session ${sessionId}`);
    logger.info(`📄 Nouvelle page: ${targetPage._id.toString()}`);
    logger.info(`✅ Terminée: ${isCompleted}`);

    await pool.query(
      `UPDATE game_sessions 
       SET current_page_mongo_id = $1, 
           is_completed = $2, 
           end_page_mongo_id = $3,
           completed_at = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        targetPage._id.toString(),
        isCompleted,
        endPageMongoId,
        isCompleted ? new Date() : null,
        sessionId,
      ]
    );

    logger.info(`✅ Session ${sessionId} mise à jour avec succès`);

    targetPage.stats.timesReached += 1;
    if (targetPage.isEnd) {
      targetPage.stats.timesCompleted += 1;

      await Story.findByIdAndUpdate(targetPage.storyId, {
        $inc: { "stats.totalCompletions": 1 },
      });

      if (req.user) {
        await pool.query(
          `INSERT INTO unlocked_endings (user_id, story_mongo_id, page_mongo_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, story_mongo_id, page_mongo_id) DO NOTHING`,
          [
            req.user.id,
            targetPage.storyId.toString(),
            targetPage._id.toString(),
          ]
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

    const sessionResult = await pool.query(
      "SELECT * FROM game_sessions WHERE id = $1",
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      logger.warn(`Session introuvable : ${sessionId}`);
      return res.status(404).json({
        success: false,
        error: "Session introuvable.",
      });
    }

    const session = sessionResult.rows[0];

    const pathResult = await pool.query(
      `SELECT page_mongo_id, choice_mongo_id, step_order, created_at 
       FROM session_paths 
       WHERE session_id = $1 
       ORDER BY step_order ASC`,
      [sessionId]
    );

    const path = pathResult.rows;

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

    const result = await pool.query(
      `SELECT id, story_mongo_id, current_page_mongo_id, is_completed, started_at, completed_at 
       FROM game_sessions 
       WHERE user_id = $1 
       ORDER BY started_at DESC`,
      [userId]
    );

    const sessions = result.rows;

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

    const sessionResult = await pool.query(
      "SELECT * FROM game_sessions WHERE id = $1",
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Session introuvable.",
      });
    }

    const session = sessionResult.rows[0];

    const pathResult = await pool.query(
      `SELECT page_mongo_id FROM session_paths 
       WHERE session_id = $1 
       ORDER BY step_order ASC`,
      [sessionId]
    );

    const currentPath = pathResult.rows.map((r) => r.page_mongo_id);

    const allPathsResult = await pool.query(
      `SELECT sp.session_id, sp.page_mongo_id, sp.step_order
       FROM session_paths sp
       JOIN game_sessions gs ON sp.session_id = gs.id
       WHERE gs.story_mongo_id = $1
       ORDER BY sp.session_id, sp.step_order`,
      [session.story_mongo_id]
    );

    const sessionPaths = {};
    allPathsResult.rows.forEach((row) => {
      if (!sessionPaths[row.session_id]) {
        sessionPaths[row.session_id] = [];
      }
      sessionPaths[row.session_id].push(row.page_mongo_id);
    });

    let totalSessions = Object.keys(sessionPaths).length;
    let similarSessions = 0;

    Object.values(sessionPaths).forEach((path) => {
      const minLength = Math.min(currentPath.length, path.length);
      let matches = 0;

      for (let i = 0; i < minLength; i++) {
        if (currentPath[i] === path[i]) {
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
      const endStatsResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM game_sessions
         WHERE story_mongo_id = $1 AND end_page_mongo_id = $2 AND is_completed = true`,
        [session.story_mongo_id, session.end_page_mongo_id]
      );

      const totalCompleted = await pool.query(
        `SELECT COUNT(*) as count
         FROM game_sessions
         WHERE story_mongo_id = $1 AND is_completed = true`,
        [session.story_mongo_id]
      );

      const endCount = parseInt(endStatsResult.rows[0].count);
      const totalCount = parseInt(totalCompleted.rows[0].count);

      endStats = {
        endPageId: session.end_page_mongo_id,
        timesReached: endCount,
        percentage:
          totalCount > 0 ? Math.round((endCount / totalCount) * 100) : 0,
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

    const result = await pool.query(
      `SELECT page_mongo_id, unlocked_at 
       FROM unlocked_endings 
       WHERE user_id = $1 AND story_mongo_id = $2
       ORDER BY unlocked_at DESC`,
      [userId, storyId]
    );

    const unlockedEndings = result.rows;

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
    const sessionsResult = await pool.query(
      `SELECT 
        gs.story_mongo_id,
        gs.is_completed,
        MAX(gs.id) as last_session_id,
        MAX(gs.updated_at) as last_updated,
        COUNT(DISTINCT gs.id) as total_sessions,
        COUNT(DISTINCT CASE WHEN gs.is_completed = true THEN gs.end_page_mongo_id END) as unique_endings
       FROM game_sessions gs
       WHERE gs.user_id = $1
       GROUP BY gs.story_mongo_id, gs.is_completed
       ORDER BY MAX(gs.updated_at) DESC`,
      [userId]
    );

    // Organiser les données par histoire
    const storiesMap = {};

    for (const row of sessionsResult.rows) {
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
      const story = stories.find(
        (s) => s._id.toString() === activity.storyId
      );

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

module.exports = {
  startGame,
  makeChoice,
  getSessionHistory,
  getMySessions,
  getUnlockedEndings,
  getPathStats,
  getMyActivities,
};
