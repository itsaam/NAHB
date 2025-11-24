const express = require("express");
const router = express.Router();
const {
  startGame,
  makeChoice,
  getSessionHistory,
  getMySessions,
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
router.post("/start", startGame);

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

module.exports = router;
