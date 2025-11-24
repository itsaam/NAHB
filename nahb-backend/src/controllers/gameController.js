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

    // Vérifier que l'histoire existe
    const story = await Story.findById(storyMongoId);

    if (!story) {
      logger.warn(`Histoire introuvable : ${storyMongoId}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Vérifier que l'histoire est publiée et non suspendue
    if (story.status !== "publié" || story.isSuspended) {
      logger.warn(
        `Tentative de jouer à une histoire non disponible : ${storyMongoId}`
      );
      return res.status(403).json({
        success: false,
        error: "Cette histoire n'est pas disponible.",
      });
    }

    // Vérifier que l'histoire a une page de départ
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

    // Créer une session de jeu dans PostgreSQL
    const result = await pool.query(
      `INSERT INTO game_sessions (user_id, story_mongo_id, current_page_mongo_id, is_preview) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, user_id, story_mongo_id, current_page_mongo_id, is_completed, started_at`,
      [userId, storyMongoId, story.startPageId.toString(), false]
    );

    const session = result.rows[0];

    // Incrémenter le compteur de parties de l'histoire
    story.stats.totalPlays += 1;
    await story.save();

    // Incrémenter le compteur de visites de la page
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

    // Récupérer la session
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

    // Trouver le choix sélectionné
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

    // Récupérer la page cible
    const targetPage = await Page.findById(choice.targetPageId);

    if (!targetPage) {
      logger.error(`Page cible introuvable : ${choice.targetPageId}`);
      return res.status(500).json({
        success: false,
        error: "Page cible introuvable.",
      });
    }

    // Enregistrer le chemin parcouru
    await pool.query(
      `INSERT INTO session_paths (session_id, page_mongo_id, choice_mongo_id, step_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(step_order), 0) + 1 FROM session_paths WHERE session_id = $1))`,
      [sessionId, currentPage._id.toString(), choiceId]
    );

    // Mettre à jour la session
    let isCompleted = targetPage.isEnd;
    let endPageMongoId = isCompleted ? targetPage._id.toString() : null;

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

    // Incrémenter les stats de la page cible
    targetPage.stats.timesReached += 1;
    if (targetPage.isEnd) {
      targetPage.stats.timesCompleted += 1;

      // Incrémenter le compteur de complétions de l'histoire
      await Story.findByIdAndUpdate(targetPage.storyId, {
        $inc: { "stats.totalCompletions": 1 },
      });

      // Enregistrer la fin débloquée
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

    // Récupérer la session
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

    // Récupérer le chemin parcouru
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

module.exports = {
  startGame,
  makeChoice,
  getSessionHistory,
  getMySessions,
};
