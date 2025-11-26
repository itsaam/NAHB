const express = require("express");
const router = express.Router();
const {
  createReview,
  getStoryReviews,
  getMyReviews,
  deleteReview,
} = require("../controllers/reviewController");
const { authenticate, canComment } = require("../middlewares/authMiddleware");
const {
  validate,
  createReviewSchema,
} = require("../middlewares/validateMiddleware");

/**
 * @route   POST /api/reviews
 * @desc    Créer ou mettre à jour une review
 * @access  Privé
 */
router.post(
  "/",
  authenticate,
  canComment,
  validate(createReviewSchema),
  createReview
);

/**
 * @route   GET /api/reviews/story/:storyId
 * @desc    Récupérer toutes les reviews d'une histoire
 * @access  Public
 */
router.get("/story/:storyId", getStoryReviews);

/**
 * @route   GET /api/reviews/my
 * @desc    Récupérer mes reviews
 * @access  Privé
 */
router.get("/my", authenticate, getMyReviews);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Supprimer une review
 * @access  Privé
 */
router.delete("/:id", authenticate, deleteReview);

module.exports = router;
