const express = require("express");
const router = express.Router();
const {
  getUnlockedEndings,
  getAllStoryEndings,
  createOrUpdateReview,
  getStoryReviews,
  deleteReview,
  createReport,
} = require("../controllers/userController");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  validate,
  createReviewSchema,
  createReportSchema,
} = require("../middlewares/validateMiddleware");

// GET /api/users/me/unlocked-endings/:storyId - Mes fins débloquées pour une histoire
router.get("/me/unlocked-endings/:storyId", authenticate, getUnlockedEndings);

// GET /api/users/endings/:storyId - Toutes les fins d'une histoire (avec statut débloqué/non débloqué)
router.get("/endings/:storyId", getAllStoryEndings);

// POST /api/users/reviews - Créer ou mettre à jour une review
router.post(
  "/reviews",
  authenticate,
  validate(createReviewSchema),
  createOrUpdateReview
);

// GET /api/users/reviews/:storyId - Récupérer les reviews d'une histoire
router.get("/reviews/:storyId", getStoryReviews);

// DELETE /api/users/reviews/:storyId - Supprimer sa review
router.delete("/reviews/:storyId", authenticate, deleteReview);

// POST /api/users/reports - Signaler une histoire
router.post("/reports", authenticate, createReport);

module.exports = router;
