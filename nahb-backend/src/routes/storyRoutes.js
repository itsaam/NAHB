const express = require("express");
const router = express.Router();
const {
  createStory,
  getPublishedStories,
  getStoryById,
  getMyStories,
  updateStory,
  deleteStory,
} = require("../controllers/storyController");
const {
  authenticate,
  optionalAuth,
  requireAuthor,
} = require("../middlewares/authMiddleware");
const {
  validate,
  createStorySchema,
  updateStorySchema,
} = require("../middlewares/validateMiddleware");

/**
 * @swagger
 * /stories:
 *   post:
 *     summary: Créer une nouvelle histoire
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               genre:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [brouillon, publié]
 *     responses:
 *       201:
 *         description: Histoire créée
 *       401:
 *         description: Non authentifié
 *   get:
 *     summary: Lister les histoires publiées
 *     tags: [Stories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des histoires
 */
router.post(
  "/",
  authenticate,
  requireAuthor,
  validate(createStorySchema),
  createStory
);
router.get("/", getPublishedStories);

/**
 * @swagger
 * /stories/my:
 *   get:
 *     summary: Récupérer mes histoires
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mes histoires
 *       401:
 *         description: Non authentifié
 */
router.get("/my", authenticate, requireAuthor, getMyStories);

/**
 * @route   GET /api/stories/:id
 * @desc    Récupérer une histoire par son ID
 * @access  Public (mais restrictions selon statut)
 */
router.get("/:id", optionalAuth, getStoryById);

/**
 * @route   PUT /api/stories/:id
 * @desc    Modifier une histoire
 * @access  Privé (auteur propriétaire ou admin)
 */
router.put(
  "/:id",
  authenticate,
  requireAuthor,
  validate(updateStorySchema),
  updateStory
);

/**
 * @route   DELETE /api/stories/:id
 * @desc    Supprimer une histoire
 * @access  Privé (auteur propriétaire ou admin)
 */
router.delete("/:id", authenticate, requireAuthor, deleteStory);

module.exports = router;
