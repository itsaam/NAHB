const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  checkStatus,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../middlewares/validateMiddleware");

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pseudo
 *               - email
 *               - password
 *             properties:
 *               pseudo:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [lecteur, auteur]
 *                 default: lecteur
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne le token JWT
 *       401:
 *         description: Identifiants incorrects
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non authentifié
 * @route   GET /api/auth/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Privé
 */
router.get("/profile", authenticate, getProfile);

/**
 * @swagger
 * /auth/status:
 *   get:
 *     summary: Vérifier le statut de l'utilisateur (ban check)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut OK
 *       403:
 *         description: Utilisateur banni
 *       401:
 *         description: Non authentifié
 */
router.get("/status", authenticate, checkStatus);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil (email, avatar)
 * @access  Privé
 */
router.put("/profile", authenticate, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Changer le mot de passe
 * @access  Privé
 */
router.put("/password", authenticate, updatePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demander une réinitialisation de mot de passe
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialiser le mot de passe avec le token
 * @access  Public
 */
router.post("/reset-password", resetPassword);

module.exports = router;
