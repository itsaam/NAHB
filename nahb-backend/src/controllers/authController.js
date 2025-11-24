const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/postgresql");
const logger = require("../utils/logger");

/**
 * Inscription d'un nouvel utilisateur
 */
const register = async (req, res) => {
  try {
    /*console.log("=== DEBUG REGISTER ===");
    console.log("Body:", req.body);
    console.log("Headers:", req.headers);
    console.log("====================="); */
    const { pseudo, email, password, role } = req.body;

    logger.info(`Tentative d'inscription : ${email}`);

    // Vérifier si l'email existe déjà
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      logger.warn(`Email déjà utilisé : ${email}`);
      return res.status(409).json({
        success: false,
        error: "Cet email est déjà utilisé.",
      });
    }

    // Vérifier si le pseudo existe déjà
    const pseudoCheck = await pool.query(
      "SELECT id FROM users WHERE pseudo = $1",
      [pseudo]
    );

    if (pseudoCheck.rows.length > 0) {
      logger.warn(`Pseudo déjà utilisé : ${pseudo}`);
      return res.status(409).json({
        success: false,
        error: "Ce pseudo est déjà utilisé.",
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (pseudo, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, pseudo, email, role, created_at`,
      [pseudo, email, hashedPassword, role || "lecteur"]
    );

    const user = result.rows[0];

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`Utilisateur créé avec succès : ${user.id} (${user.pseudo})`);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          pseudo: user.pseudo,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
        token,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors de l'inscription : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'inscription.",
    });
  }
};

/**
 * Connexion d'un utilisateur
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info(`Tentative de connexion : ${email}`);

    // Récupérer l'utilisateur
    const result = await pool.query(
      "SELECT id, pseudo, email, password, role, is_banned FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Tentative de connexion avec email inexistant : ${email}`);
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect.",
      });
    }

    const user = result.rows[0];

    // Vérifier si l'utilisateur est banni
    if (user.is_banned) {
      logger.warn(`Utilisateur banni ${user.id} a tenté de se connecter`);
      return res.status(403).json({
        success: false,
        error: "Votre compte a été banni par un administrateur.",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Mot de passe incorrect pour : ${email}`);
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect.",
      });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`Connexion réussie : ${user.id} (${user.pseudo})`);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          pseudo: user.pseudo,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors de la connexion : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la connexion.",
    });
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Récupération du profil : ${userId}`);

    const result = await pool.query(
      `SELECT id, pseudo, email, role, is_banned, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      logger.warn(`Profil introuvable : ${userId}`);
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        role: user.role,
        isBanned: user.is_banned,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération du profil : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération du profil.",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
