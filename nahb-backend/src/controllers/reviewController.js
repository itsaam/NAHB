const reviewService = require("../services/reviewService");
const Story = require("../models/mongodb/Story");
const logger = require("../utils/logger");

/**
 * Créer ou mettre à jour une review
 */
const createReview = async (req, res) => {
  try {
    const { storyMongoId, rating, comment } = req.body;
    const userId = req.user.id;

    logger.info(
      `Création d'une review pour l'histoire ${storyMongoId} par l'utilisateur ${userId}`
    );

    const story = await Story.findById(storyMongoId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    const existingReview = await reviewService.findByUserAndStory(
      userId,
      storyMongoId
    );

    let review;

    if (existingReview) {
      review = await reviewService.update(existingReview.id, {
        rating,
        comment,
      });
      logger.info(`Review mise à jour : ${review.id}`);
    } else {
      review = await reviewService.create({
        userId,
        storyMongoId,
        rating,
        comment,
      });
      logger.info(`Nouvelle review créée : ${review.id}`);
    }

    // Recalculer les stats de rating
    const ratingStats = await reviewService.getStoryRatingStats(storyMongoId);

    await Story.findByIdAndUpdate(storyMongoId, {
      "rating.average": ratingStats.average,
      "rating.count": ratingStats.count,
    });

    logger.info(
      `Statistiques de rating mises à jour pour l'histoire ${storyMongoId}: ${ratingStats.average}/5 (${ratingStats.count} avis)`
    );

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err) {
    logger.error(`Erreur lors de la création de la review : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création de la review.",
    });
  }
};

/**
 * Récupérer toutes les reviews d'une histoire
 */
const getStoryReviews = async (req, res) => {
  try {
    const { storyId } = req.params;

    logger.info(`Récupération des reviews pour l'histoire ${storyId}`);

    const reviews = await reviewService.findByStory(storyId);

    logger.info(
      `${reviews.length} reviews trouvées pour l'histoire ${storyId}`
    );

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération des reviews : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des reviews.",
    });
  }
};

/**
 * Récupérer les reviews de l'utilisateur connecté
 */
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Récupération des reviews de l'utilisateur ${userId}`);

    const reviews = await reviewService.findByUser(userId);

    logger.info(
      `${reviews.length} reviews trouvées pour l'utilisateur ${userId}`
    );

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération des reviews : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des reviews.",
    });
  }
};

/**
 * Supprimer une review
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info(`Suppression de la review ${id} par l'utilisateur ${userId}`);

    const review = await reviewService.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review introuvable.",
      });
    }

    if (review.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer cette review.",
      });
    }

    await reviewService.deleteById(id);

    // Recalculer les stats de rating
    const ratingStats = await reviewService.getStoryRatingStats(
      review.story_mongo_id
    );

    await Story.findByIdAndUpdate(review.story_mongo_id, {
      "rating.average": ratingStats.average,
      "rating.count": ratingStats.count,
    });

    logger.info(`Review ${id} supprimée avec succès`);

    return res.status(200).json({
      success: true,
      message: "Review supprimée avec succès.",
    });
  } catch (err) {
    logger.error(`Erreur lors de la suppression de la review : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression de la review.",
    });
  }
};

module.exports = {
  createReview,
  getStoryReviews,
  getMyReviews,
  deleteReview,
};
