const express = require("express");
const router = express.Router();
const {
  startGame,
  makeChoice,
  getSessionHistory,
  getMySessions,
  getUnlockedEndings,
  getPathStats,
  getMyActivities,
  navigateToPage,
} = require("../controllers/gameController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /game/start:
 *   post:
 *     summary: Démarrer une nouvelle partie
 *     tags: [Game]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyId
 *             properties:
 *               storyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session créée
 */
router.post("/start", authenticate, startGame);

/**
 * @swagger
 * /game/session/{sessionId}/choice:
 *   post:
 *     summary: Faire un choix et naviguer
 *     tags: [Game]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choiceId
 *             properties:
 *               choiceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Prochaine page
 */
router.post("/session/:sessionId/choice", makeChoice);

/**
 * @swagger
 * /game/session/{sessionId}/history:
 *   get:
 *     summary: Récupérer l'historique d'une session
 *     tags: [Game]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historique de la session
 */
router.get("/session/:sessionId/history", getSessionHistory);

/**
 * @swagger
 * /game/my-sessions:
 *   get:
 *     summary: Récupérer mes sessions
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste de mes sessions
 *       401:
 *         description: Non authentifié
 */
router.get("/my-sessions", authenticate, getMySessions);

/**
 * @route   GET /api/game/story/:storyId/endings
 * @desc    Récupérer les fins débloquées pour une histoire
 * @access  Privé
 */
router.get("/story/:storyId/endings", authenticate, getUnlockedEndings);

/**
 * @route   GET /api/game/session/:sessionId/stats
 * @desc    Obtenir les statistiques de parcours d'une session
 * @access  Public
 */
router.get("/session/:sessionId/stats", getPathStats);

/**
 * @route   GET /api/game/my-activities
 * @desc    Récupérer les activités de l'utilisateur (histoires terminées et en cours)
 * @access  Privé
 */
router.get("/my-activities", authenticate, getMyActivities);

/**
 * @route   POST /api/game/session/:sessionId/navigate
 * @desc    Naviguer directement vers une page (pour les échecs de jet de dé)
 * @access  Public
 */
router.post("/session/:sessionId/navigate", navigateToPage);

module.exports = router;
