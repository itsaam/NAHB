const { pool } = require("../config/postgresql");
const Story = require("../models/mongodb/Story");
const logger = require("../utils/logger");

// Nombre de signalements acceptés pour suspension auto
const REPORTS_THRESHOLD = 5;

/**
 * Bannir un utilisateur avec type de ban
 * Types: 'full' (complet), 'author' (ne peut plus créer), 'comment' (ne peut plus commenter)
 */
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { banType = "full", reason } = req.body;
    const adminId = req.user.id;

    // Valider le type de ban
    if (!["full", "author", "comment"].includes(banType)) {
      return res.status(400).json({
        success: false,
        error: "Type de ban invalide. Utilisez: full, author, ou comment.",
      });
    }

    logger.info(`Admin ${adminId} bannit l'utilisateur ${userId} (type: ${banType})`);

    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query(
      "SELECT id, pseudo, role FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      logger.warn(`Utilisateur introuvable : ${userId}`);
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    const user = userCheck.rows[0];

    // Empêcher de bannir un admin
    if (user.role === "admin") {
      logger.warn(`Tentative de bannir un admin : ${userId}`);
      return res.status(403).json({
        success: false,
        error: "Impossible de bannir un administrateur.",
      });
    }

    // Bannir l'utilisateur
    await pool.query(
      `UPDATE users SET 
        is_banned = TRUE, 
        ban_type = $1, 
        ban_reason = $2, 
        banned_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3`,
      [banType, reason || null, userId]
    );

    const banTypeLabels = {
      full: "complètement banni",
      author: "interdit de créer des histoires",
      comment: "interdit de commenter",
    };

    logger.info(`Utilisateur ${userId} (${user.pseudo}) ${banTypeLabels[banType]}`);

    return res.status(200).json({
      success: true,
      data: {
        message: `L'utilisateur ${user.pseudo} a été ${banTypeLabels[banType]}.`,
        banType,
        reason,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors du bannissement : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors du bannissement.",
    });
  }
};

/**
 * Débannir un utilisateur
 */
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    logger.info(`Admin ${adminId} débannit l'utilisateur ${userId}`);

    // Vérifier que l'utilisateur existe
    const userCheck = await pool.query(
      "SELECT id, pseudo FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      logger.warn(`Utilisateur introuvable : ${userId}`);
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    const user = userCheck.rows[0];

    // Débannir l'utilisateur (reset tous les champs de ban)
    await pool.query(
      `UPDATE users SET 
        is_banned = FALSE, 
        ban_type = NULL, 
        ban_reason = NULL, 
        banned_at = NULL,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1`,
      [userId]
    );

    logger.info(`Utilisateur ${userId} (${user.pseudo}) débanni avec succès`);

    return res.status(200).json({
      success: true,
      data: {
        message: `L'utilisateur ${user.pseudo} a été débanni avec succès.`,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors du débannissement : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors du débannissement.",
    });
  }
};

/**
 * Suspendre une histoire (niveau 10/20)
 */
const suspendStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const adminId = req.user.id;

    logger.info(`Admin ${adminId} suspend l'histoire ${storyId}`);

    const story = await Story.findById(storyId);

    if (!story) {
      logger.warn(`Histoire introuvable : ${storyId}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Suspendre l'histoire
    story.isSuspended = true;
    await story.save();

    logger.info(`Histoire ${storyId} (${story.title}) suspendue avec succès`);

    return res.status(200).json({
      success: true,
      data: {
        message: `L'histoire "${story.title}" a été suspendue avec succès.`,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors de la suspension de l'histoire : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suspension de l'histoire.",
    });
  }
};

/**
 * Réactiver une histoire suspendue
 */
const unsuspendStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const adminId = req.user.id;

    logger.info(`Admin ${adminId} réactive l'histoire ${storyId}`);

    const story = await Story.findById(storyId);

    if (!story) {
      logger.warn(`Histoire introuvable : ${storyId}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Réactiver l'histoire
    story.isSuspended = false;
    await story.save();

    logger.info(`Histoire ${storyId} (${story.title}) réactivée avec succès`);

    return res.status(200).json({
      success: true,
      data: {
        message: `L'histoire "${story.title}" a été réactivée avec succès.`,
      },
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la réactivation de l'histoire : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la réactivation de l'histoire.",
    });
  }
};

/**
 * Récupérer les statistiques globales (niveau 10/20)
 */
const getGlobalStats = async (req, res) => {
  try {
    logger.info("Récupération des statistiques globales");

    // Stats PostgreSQL
    const userStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'auteur') as total_authors,
        COUNT(*) FILTER (WHERE role = 'lecteur') as total_readers,
        COUNT(*) FILTER (WHERE is_banned = TRUE) as banned_users
      FROM users
    `);

    const sessionStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE is_completed = TRUE) as completed_sessions
      FROM game_sessions
    `);

    const reviewStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating
      FROM reviews
    `);

    const reportStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports
      FROM reports
    `);

    // Stats MongoDB
    const totalStories = await Story.countDocuments();
    const publishedStories = await Story.countDocuments({
      status: "publié",
      isSuspended: false,
    });
    const suspendedStories = await Story.countDocuments({ isSuspended: true });

    const storyStats = await Story.aggregate([
      {
        $group: {
          _id: null,
          totalPlays: { $sum: "$stats.totalPlays" },
          totalCompletions: { $sum: "$stats.totalCompletions" },
        },
      },
    ]);

    const stats = {
      users: userStatsResult.rows[0],
      stories: {
        total: totalStories,
        published: publishedStories,
        suspended: suspendedStories,
        totalPlays: storyStats[0]?.totalPlays || 0,
        totalCompletions: storyStats[0]?.totalCompletions || 0,
      },
      sessions: sessionStatsResult.rows[0],
      reviews: {
        total: parseInt(reviewStatsResult.rows[0].total_reviews),
        averageRating: parseFloat(
          reviewStatsResult.rows[0].average_rating || 0
        ).toFixed(2),
      },
      reports: reportStatsResult.rows[0],
    };

    logger.info("Statistiques globales récupérées avec succès");

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des statistiques : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des statistiques.",
    });
  }
};

/**
 * Lister tous les utilisateurs
 */
const getAllUsers = async (req, res) => {
  try {
    logger.info("Récupération de tous les utilisateurs");

    const result = await pool.query(`
      SELECT id, pseudo, email, role, is_banned, ban_type, ban_reason, banned_at, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    const users = result.rows;

    logger.info(`${users.length} utilisateurs trouvés`);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des utilisateurs : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des utilisateurs.",
    });
  }
};

/**
 * Lister toutes les histoires (y compris brouillons et suspendues)
 */
const getAllStories = async (req, res) => {
  try {
    logger.info("Récupération de toutes les histoires");

    const stories = await Story.find()
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    logger.info(`${stories.length} histoires trouvées`);

    return res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des histoires : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des histoires.",
    });
  }
};

/**
 * Lister tous les signalements
 */
const getAllReports = async (req, res) => {
  try {
    const { status } = req.query;

    logger.info("Récupération des signalements");

    let query = "SELECT * FROM reports ORDER BY created_at DESC";
    const params = [];

    if (status) {
      query =
        "SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC";
      params.push(status);
    }

    const result = await pool.query(query, params);
    const reports = result.rows;

    logger.info(`${reports.length} signalements trouvés`);

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des signalements : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des signalements.",
    });
  }
};

/**
 * Traiter un signalement (avec suspension auto si 5 signalements acceptés)
 */
const handleReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body; // 'resolved' ou 'rejected'

    if (!["resolved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Le statut doit être "resolved" ou "rejected".',
      });
    }

    logger.info(`Traitement du signalement ${reportId} : ${status}`);

    // Récupérer le signalement
    const reportResult = await pool.query(
      "SELECT * FROM reports WHERE id = $1",
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      logger.warn(`Signalement introuvable : ${reportId}`);
      return res.status(404).json({
        success: false,
        error: "Signalement introuvable.",
      });
    }

    const report = reportResult.rows[0];

    // Mettre à jour le signalement
    await pool.query(
      "UPDATE reports SET status = $1 WHERE id = $2",
      [status, reportId]
    );

    let storySuspended = false;

    // Si le signalement est accepté, vérifier le nombre de signalements acceptés pour cette histoire
    if (status === "resolved") {
      const countResult = await pool.query(
        "SELECT COUNT(*) as count FROM reports WHERE story_mongo_id = $1 AND status = 'resolved'",
        [report.story_mongo_id]
      );

      const resolvedCount = parseInt(countResult.rows[0].count);
      logger.info(`Histoire ${report.story_mongo_id} : ${resolvedCount} signalements acceptés`);

      // Si >= 5 signalements acceptés, suspendre automatiquement l'histoire
      if (resolvedCount >= REPORTS_THRESHOLD) {
        const story = await Story.findById(report.story_mongo_id);
        
        if (story && !story.isSuspended) {
          story.isSuspended = true;
          story.suspendedReason = `Suspension automatique : ${resolvedCount} signalements acceptés`;
          await story.save();
          
          storySuspended = true;
          logger.info(`Histoire ${report.story_mongo_id} suspendue automatiquement (${resolvedCount} signalements)`);
        }
      }
    }

    logger.info(`Signalement ${reportId} traité avec succès`);

    return res.status(200).json({
      success: true,
      data: {
        ...report,
        status,
        storySuspended,
        message: storySuspended 
          ? "Signalement traité. L'histoire a été automatiquement suspendue (5+ signalements acceptés)."
          : "Signalement traité avec succès.",
      },
    });
  } catch (err) {
    logger.error(`Erreur lors du traitement du signalement : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors du traitement du signalement.",
    });
  }
};

module.exports = {
  banUser,
  unbanUser,
  suspendStory,
  unsuspendStory,
  getGlobalStats,
  getAllUsers,
  getAllStories,
  getAllReports,
  handleReport,
};
