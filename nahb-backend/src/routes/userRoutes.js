const express = require("express");
const router = express.Router();
const {
  getUnlockedEndings,
  getAllStoryEndings,
} = require("../controllers/userController");
const { authenticate } = require("../middlewares/authMiddleware");

// GET /api/users/me/unlocked-endings/:storyId - Mes fins débloquées pour une histoire
router.get("/me/unlocked-endings/:storyId", authenticate, getUnlockedEndings);

// GET /api/users/endings/:storyId - Toutes les fins d'une histoire (avec statut débloqué/non débloqué)
router.get("/endings/:storyId", getAllStoryEndings);

module.exports = router;
