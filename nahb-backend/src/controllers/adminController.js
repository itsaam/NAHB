const userService = require("../services/userService");
const reportService = require("../services/reportService");
const reviewService = require("../services/reviewService");
const gameSessionService = require("../services/gameSessionService");
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

    logger.info(
      `Admin ${adminId} bannit l'utilisateur ${userId} (type: ${banType})`
    );

    // Vérifier que l'utilisateur existe
    const user = await userService.findById(userId);

    if (!user) {
      logger.warn(`Utilisateur introuvable : ${userId}`);
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    // Empêcher de bannir un admin
    if (user.role === "admin") {
      logger.warn(`Tentative de bannir un admin : ${userId}`);
      return res.status(403).json({
        success: false,
        error: "Impossible de bannir un administrateur.",
      });
    }

    // Bannir l'utilisateur
    await userService.ban(userId, banType, reason);

    const banTypeLabels = {
      full: "complètement banni",
      author: "interdit de créer des histoires",
      comment: "interdit de commenter",
    };

    logger.info(
      `Utilisateur ${userId} (${user.pseudo}) ${banTypeLabels[banType]}`
    );

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
    const user = await userService.findById(userId);

    if (!user) {
      logger.warn(`Utilisateur introuvable : ${userId}`);
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    // Débannir l'utilisateur
    await userService.unban(userId);

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
    const userStats = await userService.getStats();
    const sessionStats = await gameSessionService.getGlobalStats();
    const reviewStats = await reviewService.getGlobalStats();
    const reportStats = await reportService.getGlobalStats();

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
      users: userStats,
      stories: {
        total: totalStories,
        published: publishedStories,
        suspended: suspendedStories,
        totalPlays: storyStats[0]?.totalPlays || 0,
        totalCompletions: storyStats[0]?.totalCompletions || 0,
      },
      sessions: sessionStats,
      reviews: reviewStats,
      reports: reportStats,
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

    const users = await userService.findAll();

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

    const reports = await reportService.findAll(status);

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
    const report = await reportService.findById(reportId);

    if (!report) {
      logger.warn(`Signalement introuvable : ${reportId}`);
      return res.status(404).json({
        success: false,
        error: "Signalement introuvable.",
      });
    }

    // Mettre à jour le signalement
    await reportService.updateStatus(reportId, status);

    let storySuspended = false;

    // Si le signalement est accepté, vérifier le nombre de signalements acceptés pour cette histoire
    if (status === "resolved") {
      const resolvedCount = await reportService.countResolvedByStory(
        report.story_mongo_id
      );
      logger.info(
        `Histoire ${report.story_mongo_id} : ${resolvedCount} signalements acceptés`
      );

      // Si >= 5 signalements acceptés, suspendre automatiquement l'histoire
      if (resolvedCount >= REPORTS_THRESHOLD) {
        const story = await Story.findById(report.story_mongo_id);

        if (story && !story.isSuspended) {
          story.isSuspended = true;
          story.suspendedReason = `Suspension automatique : ${resolvedCount} signalements acceptés`;
          await story.save();

          storySuspended = true;
          logger.info(
            `Histoire ${report.story_mongo_id} suspendue automatiquement (${resolvedCount} signalements)`
          );
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
