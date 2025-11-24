const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../middlewares/validateMiddleware");

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post("/register", validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post("/login", validate(loginSchema), login);

/**
 * @route   GET /api/auth/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Privé
 */
router.get("/profile", authenticate, getProfile);

module.exports = router;
