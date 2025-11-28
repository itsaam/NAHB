const reviewService = require("../services/reviewService");
const unlockedEndingService = require("../services/unlockedEndingService");
const Story = require("../models/mongodb/Story");
const Page = require("../models/mongodb/Page");
const logger = require("../utils/logger");

/**
 * Récupérer les fins débloquées par l'utilisateur pour une histoire
 */
const getUnlockedEndings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storyId } = req.params;

    // Vérifier que l'histoire existe
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable",
      });
    }

    // Récupérer les fins débloquées depuis PostgreSQL
    const unlockedData = await unlockedEndingService.findByUserAndStory(
      userId,
      storyId
    );

    // Récupérer les détails des pages finales depuis MongoDB
    const endPageIds = unlockedData.map((row) => row.end_page_mongo_id);
    const endPages = await Page.find({
      _id: { $in: endPageIds },
      storyId: storyId,
      isEnd: true,
    }).select("_id content endLabel illustration");

    // Construire la réponse avec les dates de déblocage
    const unlockedEndings = endPages.map((page) => {
      const unlockInfo = unlockedData.find(
        (row) => row.end_page_mongo_id === page._id.toString()
      );
      return {
        _id: page._id,
        endLabel: page.endLabel,
        content: page.content,
        illustration: page.illustration,
        unlockedAt: unlockInfo?.unlocked_at,
      };
    });

    logger.info(
      `Fins débloquées récupérées pour l'utilisateur ${userId} - Histoire: ${storyId}`
    );

    res.status(200).json({
      success: true,
      data: {
        storyId: story._id,
        storyTitle: story.title,
        unlockedEndings,
        totalUnlocked: unlockedEndings.length,
      },
    });
  } catch (error) {
    logger.error(`Erreur getUnlockedEndings : ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des fins débloquées",
    });
  }
};

/**
 * Récupérer toutes les fins possibles d'une histoire (pour voir ce qui reste à débloquer)
 */
const getAllStoryEndings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { storyId } = req.params;

    // Vérifier que l'histoire existe et est publiée
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable",
      });
    }

    if (
      story.status !== "publié" &&
      (!req.user || story.authorPostgresId !== userId)
    ) {
      return res.status(403).json({
        success: false,
        error: "Histoire non accessible",
      });
    }

    // Récupérer toutes les pages finales de l'histoire
    const allEndings = await Page.find({
      storyId: storyId,
      isEnd: true,
    }).select("_id endLabel content illustration");

    // Si l'utilisateur est connecté, marquer celles qu'il a débloquées
    let unlockedEndingIds = [];
    if (userId) {
      unlockedEndingIds =
        await unlockedEndingService.getEndPageIdsByUserAndStory(
          userId,
          storyId
        );
    }

    // Construire la réponse
    const endings = allEndings.map((ending) => ({
      _id: ending._id,
      endLabel: ending.endLabel,
      content: ending.content,
      illustration: ending.illustration,
      isUnlocked: unlockedEndingIds.includes(ending._id.toString()),
    }));

    logger.info(`Liste des fins récupérée pour l'histoire ${storyId}`);

    res.status(200).json({
      success: true,
      data: {
        storyId: story._id,
        storyTitle: story.title,
        endings,
        totalEndings: endings.length,
        unlockedCount: unlockedEndingIds.length,
      },
    });
  } catch (error) {
    logger.error(`Erreur getAllStoryEndings : ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des fins",
    });
  }
};

/**
 * Créer ou mettre à jour une review
 */
const createOrUpdateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storyMongoId, rating, comment } = req.body;

    // Vérifier que l'histoire existe
    const story = await Story.findById(storyMongoId);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, error: "Histoire introuvable" });
    }

    // Vérifier si une review existe déjà
    const existing = await reviewService.findByUserAndStory(
      userId,
      storyMongoId
    );

    if (existing) {
      // Mettre à jour
      await reviewService.update(existing.id, { rating, comment });
      logger.info(
        `Review mise à jour - User: ${userId}, Story: ${storyMongoId}`
      );
    } else {
      // Créer
      await reviewService.create({ userId, storyMongoId, rating, comment });
      logger.info(`Review créée - User: ${userId}, Story: ${storyMongoId}`);
    }

    // Recalculer la moyenne des notes
    const stats = await reviewService.getStoryRatingStats(storyMongoId);

    await Story.findByIdAndUpdate(storyMongoId, {
      "rating.average": stats.average,
      "rating.count": stats.count,
    });

    res.status(200).json({ success: true, message: "Review enregistrée" });
  } catch (error) {
    logger.error(`Erreur createOrUpdateReview : ${error.message}`);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

/**
 * Récupérer les reviews d'une histoire
 */
const getStoryReviews = async (req, res) => {
  try {
    const { storyId } = req.params;

    const reviews = await reviewService.findByStory(storyId);

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    logger.error(`Erreur getStoryReviews : ${error.message}`);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

/**
 * Supprimer sa propre review
 */
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storyId } = req.params;

    const result = await reviewService.deleteByUserAndStory(userId, storyId);

    if (!result) {
      return res
        .status(404)
        .json({ success: false, error: "Review introuvable" });
    }

    logger.info(`Review supprimée - User: ${userId}, Story: ${storyId}`);
    res.status(200).json({ success: true, message: "Review supprimée" });
  } catch (error) {
    logger.error(`Erreur deleteReview : ${error.message}`);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

/**
 * Créer un signalement
 */
const createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storyMongoId, reason } = req.body;
    const reportService = require("../services/reportService");

    // Vérifier que l'histoire existe
    const story = await Story.findById(storyMongoId);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, error: "Histoire introuvable" });
    }

    // Insérer le signalement
    await reportService.create({ userId, storyMongoId, reason });

    logger.info(`Signalement créé - User: ${userId}, Story: ${storyMongoId}`);
    res.status(201).json({ success: true, message: "Signalement enregistré" });
  } catch (error) {
    logger.error(`Erreur createReport : ${error.message}`);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

module.exports = {
  getUnlockedEndings,
  getAllStoryEndings,
  createOrUpdateReview,
  getStoryReviews,
  deleteReview,
  createReport,
};
