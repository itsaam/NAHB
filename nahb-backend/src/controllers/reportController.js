const reportService = require("../services/reportService");
const Story = require("../models/mongodb/Story");
const logger = require("../utils/logger");

/**
 * Créer un signalement
 */
const createReport = async (req, res) => {
  try {
    const { storyMongoId, reason } = req.body;
    const userId = req.user.id;

    logger.info(
      `Signalement de l'histoire ${storyMongoId} par l'utilisateur ${userId}`
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

    // Créer le signalement
    const report = await reportService.create({ userId, storyMongoId, reason });

    logger.info(`Signalement créé avec succès : ${report.id}`);

    return res.status(201).json({
      success: true,
      data: report,
    });
  } catch (err) {
    logger.error(`Erreur lors de la création du signalement : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création du signalement.",
    });
  }
};

/**
 * Récupérer les signalements de l'utilisateur connecté
 */
const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Récupération des signalements de l'utilisateur ${userId}`);

    const reports = await reportService.findByUser(userId);

    logger.info(
      `${reports.length} signalements trouvés pour l'utilisateur ${userId}`
    );

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

module.exports = {
  createReport,
  getMyReports,
};
