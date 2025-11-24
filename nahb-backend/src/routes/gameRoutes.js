const express = require("express");
const router = express.Router();
const {
  startGame,
  makeChoice,
  getSessionHistory,
  getMySessions,
  getUnlockedEndings,
  getPathStats,
} = require("../controllers/gameController");
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * @route   POST /api/game/start
 * @desc    Démarrer une nouvelle partie
 * @access  Public (authentification optionnelle)
 */
router.post("/start", startGame);

/**
 * @route   POST /api/game/session/:sessionId/choice
 * @desc    Faire un choix et naviguer
 * @access  Public
 */
router.post("/session/:sessionId/choice", makeChoice);

/**
 * @route   GET /api/game/session/:sessionId/history
 * @desc    Récupérer l'historique d'une session
 * @access  Public
 */
router.get("/session/:sessionId/history", getSessionHistory);

/**
 * @route   GET /api/game/my-sessions
 * @desc    Récupérer les sessions de l'utilisateur connecté
 * @access  Privé
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

module.exports = router;
