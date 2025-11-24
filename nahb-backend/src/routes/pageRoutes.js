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
 * @swagger
 * /pages:
 *   post:
 *     summary: Créer une nouvelle page
 *     tags: [Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyId
 *               - content
 *             properties:
 *               storyId:
 *                 type: string
 *               content:
 *                 type: string
 *               isEnd:
 *                 type: boolean
 *               endLabel:
 *                 type: string
 *               choices:
 *                 type: array
 *     responses:
 *       201:
 *         description: Page créée
 */
router.post(
  "/",
  authenticate,
  requireAuthor,
  validate(createPageSchema),
  createPage
);

/**
 * @swagger
 * /pages/story/{storyId}:
 *   get:
 *     summary: Récupérer toutes les pages d'une histoire
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des pages
 */
router.get("/story/:storyId", getStoryPages);

/**
 * @swagger
 * /pages/{id}:
 *   get:
 *     summary: Récupérer une page par son ID
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de la page
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
