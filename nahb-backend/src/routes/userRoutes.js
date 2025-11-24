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

/**
 * @swagger
 * /users/me/unlocked-endings/{storyId}:
 *   get:
 *     summary: Récupérer mes fins débloquées pour une histoire
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des fins débloquées
 *       401:
 *         description: Non authentifié
 */
router.get("/me/unlocked-endings/:storyId", authenticate, getUnlockedEndings);

/**
 * @swagger
 * /users/endings/{storyId}:
 *   get:
 *     summary: Toutes les fins d'une histoire (avec statut débloqué/non débloqué)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste de toutes les fins
 */
router.get("/endings/:storyId", getAllStoryEndings);

/**
 * @swagger
 * /users/reviews:
 *   post:
 *     summary: Créer ou mettre à jour une review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyMongoId
 *               - rating
 *             properties:
 *               storyMongoId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review enregistrée
 *       401:
 *         description: Non authentifié
 */
router.post(
  "/reviews",
  authenticate,
  validate(createReviewSchema),
  createOrUpdateReview
);

/**
 * @swagger
 * /users/reviews/{storyId}:
 *   get:
 *     summary: Récupérer les reviews d'une histoire
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des reviews
 *   delete:
 *     summary: Supprimer sa review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review supprimée
 *       401:
 *         description: Non authentifié
 */
router.get("/reviews/:storyId", getStoryReviews);
router.delete("/reviews/:storyId", authenticate, deleteReview);

/**
 * @swagger
 * /users/reports:
 *   post:
 *     summary: Signaler une histoire
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyMongoId
 *               - reason
 *             properties:
 *               storyMongoId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       201:
 *         description: Signalement enregistré
 *       401:
 *         description: Non authentifié
 */
router.post("/reports", authenticate, createReport);

module.exports = router;
