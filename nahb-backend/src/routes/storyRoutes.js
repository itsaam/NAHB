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
  requireAuthor,
} = require("../middlewares/authMiddleware");
const {
  validate,
  createStorySchema,
  updateStorySchema,
} = require("../middlewares/validateMiddleware");

/**
 * @route   POST /api/stories
 * @desc    Créer une nouvelle histoire
 * @access  Privé (auteur)
 */
router.post(
  "/",
  authenticate,
  requireAuthor,
  validate(createStorySchema),
  createStory
);

/**
 * @route   GET /api/stories
 * @desc    Lister les histoires publiées (avec filtres/recherche)
 * @access  Public
 */
router.get("/", getPublishedStories);

/**
 * @route   GET /api/stories/my
 * @desc    Récupérer les histoires de l'auteur connecté
 * @access  Privé (auteur)
 */
router.get("/my", authenticate, requireAuthor, getMyStories);

/**
 * @route   GET /api/stories/:id
 * @desc    Récupérer une histoire par son ID
 * @access  Public (mais restrictions selon statut)
 */
router.get("/:id", getStoryById);

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
