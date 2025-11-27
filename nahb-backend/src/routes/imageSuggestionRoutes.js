const express = require("express");
const router = express.Router();
const {
  suggestImage,
  getAllSuggestions,
  approveSuggestion,
  rejectSuggestion,
  getMySuggestions,
} = require("../controllers/imageSuggestionController");
const { authenticate, requireAdmin } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: ImageSuggestions
 *   description: Gestion des suggestions d'images par les utilisateurs
 */

/**
 * @swagger
 * /api/image-suggestions:
 *   get:
 *     summary: Récupérer toutes les suggestions (admin) avec filtres optionnels
 *     tags: [ImageSuggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: themeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des suggestions
 *   post:
 *     summary: Proposer une image pour un thème
 *     tags: [ImageSuggestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - themeId
 *               - imageUrl
 *             properties:
 *               themeId:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Image proposée avec succès
 */
router.get("/", authenticate, requireAdmin, getAllSuggestions);
router.post("/", authenticate, suggestImage);

/**
 * @swagger
 * /api/image-suggestions/my:
 *   get:
 *     summary: Récupérer mes suggestions
 *     tags: [ImageSuggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes suggestions
 */
router.get("/my", authenticate, getMySuggestions);

/**
 * @swagger
 * /api/image-suggestions/{id}/approve:
 *   post:
 *     summary: Approuver une suggestion (admin)
 *     tags: [ImageSuggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suggestion approuvée
 */
router.post("/:id/approve", authenticate, requireAdmin, approveSuggestion);

/**
 * @swagger
 * /api/image-suggestions/{id}/reject:
 *   post:
 *     summary: Rejeter une suggestion (admin)
 *     tags: [ImageSuggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suggestion rejetée
 */
router.post("/:id/reject", authenticate, requireAdmin, rejectSuggestion);

module.exports = router;
