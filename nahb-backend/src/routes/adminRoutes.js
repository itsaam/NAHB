const express = require("express");
const router = express.Router();
const {
  banUser,
  unbanUser,
  suspendStory,
  unsuspendStory,
  getGlobalStats,
  getAllUsers,
  getAllStories,
  getAllReports,
  handleReport,
} = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middlewares/authMiddleware");

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(authenticate, requireAdmin);

/**
 * @route   POST /api/admin/users/:userId/ban
 * @desc    Bannir un utilisateur
 * @access  Admin
 */
router.post("/users/:userId/ban", banUser);

/**
 * @route   POST /api/admin/users/:userId/unban
 * @desc    Débannir un utilisateur
 * @access  Admin
 */
router.post("/users/:userId/unban", unbanUser);

/**
 * @route   POST /api/admin/stories/:storyId/suspend
 * @desc    Suspendre une histoire
 * @access  Admin
 */
router.post("/stories/:storyId/suspend", suspendStory);

/**
 * @route   POST /api/admin/stories/:storyId/unsuspend
 * @desc    Réactiver une histoire suspendue
 * @access  Admin
 */
router.post("/stories/:storyId/unsuspend", unsuspendStory);

/**
 * @route   GET /api/admin/stats
 * @desc    Récupérer les statistiques globales
 * @access  Admin
 */
router.get("/stats", getGlobalStats);

/**
 * @route   GET /api/admin/users
 * @desc    Lister tous les utilisateurs
 * @access  Admin
 */
router.get("/users", getAllUsers);

/**
 * @route   GET /api/admin/stories
 * @desc    Lister toutes les histoires (y compris brouillons)
 * @access  Admin
 */
router.get("/stories", getAllStories);

/**
 * @route   GET /api/admin/reports
 * @desc    Lister tous les signalements
 * @access  Admin
 */
router.get("/reports", getAllReports);

/**
 * @route   PUT /api/admin/reports/:reportId
 * @desc    Traiter un signalement (resolved/rejected)
 * @access  Admin
 */
router.put("/reports/:reportId", handleReport);

module.exports = router;
