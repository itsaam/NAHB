const express = require("express");
const router = express.Router();
const {
  createPage,
  getStoryPages,
  getPageById,
  updatePage,
  deletePage,
  addChoice,
  deleteChoice,
} = require("../controllers/pageController");
const {
  authenticate,
  requireAuthor,
} = require("../middlewares/authMiddleware");
const {
  validate,
  createPageSchema,
  updatePageSchema,
  addChoiceSchema,
} = require("../middlewares/validateMiddleware");

/**
 * @route   POST /api/pages
 * @desc    Créer une nouvelle page
 * @access  Privé (auteur)
 */
router.post(
  "/",
  authenticate,
  requireAuthor,
  validate(createPageSchema),
  createPage
);

/**
 * @route   GET /api/pages/story/:storyId
 * @desc    Récupérer toutes les pages d'une histoire
 * @access  Public
 */
router.get("/story/:storyId", getStoryPages);

/**
 * @route   GET /api/pages/:id
 * @desc    Récupérer une page par son ID
 * @access  Public
 */
router.get("/:id", getPageById);

/**
 * @route   PUT /api/pages/:id
 * @desc    Modifier une page
 * @access  Privé (auteur propriétaire ou admin)
 */
router.put(
  "/:id",
  authenticate,
  requireAuthor,
  validate(updatePageSchema),
  updatePage
);

/**
 * @route   DELETE /api/pages/:id
 * @desc    Supprimer une page
 * @access  Privé (auteur propriétaire ou admin)
 */
router.delete("/:id", authenticate, requireAuthor, deletePage);

/**
 * @route   POST /api/pages/:pageId/choices
 * @desc    Ajouter un choix à une page
 * @access  Privé (auteur propriétaire ou admin)
 */
router.post(
  "/:pageId/choices",
  authenticate,
  requireAuthor,
  validate(addChoiceSchema),
  addChoice
);

/**
 * @route   DELETE /api/pages/:pageId/choices/:choiceId
 * @desc    Supprimer un choix d'une page
 * @access  Privé (auteur propriétaire ou admin)
 */
router.delete(
  "/:pageId/choices/:choiceId",
  authenticate,
  requireAuthor,
  deleteChoice
);

module.exports = router;
