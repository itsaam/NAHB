const { pool } = require("../config/postgresql");
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

    const existingReview = await pool.query(
      "SELECT id FROM reviews WHERE user_id = $1 AND story_mongo_id = $2",
      [userId, storyMongoId]
    );

    let reviewResult;

    if (existingReview.rows.length > 0) {
      reviewResult = await pool.query(
        `UPDATE reviews 
         SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP 
         WHERE user_id = $3 AND story_mongo_id = $4 
         RETURNING *`,
        [rating, comment, userId, storyMongoId]
      );
      logger.info(`Review mise à jour : ${reviewResult.rows[0].id}`);
    } else {
      reviewResult = await pool.query(
        `INSERT INTO reviews (user_id, story_mongo_id, rating, comment) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userId, storyMongoId, rating, comment]
      );
      logger.info(`Nouvelle review créée : ${reviewResult.rows[0].id}`);
    }

    const ratingsResult = await pool.query(
      "SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE story_mongo_id = $1",
      [storyMongoId]
    );

    const avgRating = parseFloat(ratingsResult.rows[0].avg_rating) || 0;
    const ratingCount = parseInt(ratingsResult.rows[0].count) || 0;

    await Story.findByIdAndUpdate(storyMongoId, {
      "rating.average": avgRating,
      "rating.count": ratingCount,
    });

    logger.info(
      `Statistiques de rating mises à jour pour l'histoire ${storyMongoId}: ${avgRating}/5 (${ratingCount} avis)`
    );

    return res.status(200).json({
      success: true,
      data: reviewResult.rows[0],
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

    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, 
              u.id as user_id, u.pseudo 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.story_mongo_id = $1 
       ORDER BY r.created_at DESC`,
      [storyId]
    );

    logger.info(
      `${result.rows.length} reviews trouvées pour l'histoire ${storyId}`
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
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

    const result = await pool.query(
      `SELECT r.id, r.story_mongo_id, r.rating, r.comment, r.created_at 
       FROM reviews r 
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC`,
      [userId]
    );

    logger.info(
      `${result.rows.length} reviews trouvées pour l'utilisateur ${userId}`
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
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

    const reviewResult = await pool.query(
      "SELECT * FROM reviews WHERE id = $1",
      [id]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Review introuvable.",
      });
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer cette review.",
      });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [id]);

    const ratingsResult = await pool.query(
      "SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE story_mongo_id = $1",
      [review.story_mongo_id]
    );

    const avgRating = parseFloat(ratingsResult.rows[0].avg_rating) || 0;
    const ratingCount = parseInt(ratingsResult.rows[0].count) || 0;

    await Story.findByIdAndUpdate(review.story_mongo_id, {
      "rating.average": avgRating,
      "rating.count": ratingCount,
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
