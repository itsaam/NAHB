const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/postgresql");
const logger = require("../utils/logger");
const {
  created,
  conflict,
  unauthorized,
  forbidden,
  notFound,
  success,
  serverError,
  badRequest,
} = require("../utils/responses");
const {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require("../utils/emailService");

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
      return conflict(res, "Ces identifiants sont déjà utilisés.");
    }

    // Vérifier si le pseudo existe déjà
    const pseudoCheck = await pool.query(
      "SELECT id FROM users WHERE pseudo = $1",
      [pseudo]
    );

    if (pseudoCheck.rows.length > 0) {
      logger.warn(`Pseudo déjà utilisé : ${pseudo}`);
      return conflict(res, "Ces identifiants sont déjà utilisés.");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (pseudo, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, pseudo, email, role, avatar, created_at`,
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

    // Envoyer l'email de bienvenue (async, ne bloque pas l'inscription)
    sendWelcomeEmail(user.email, user.pseudo).catch((error) => {
      logger.error(
        `Erreur envoi email de bienvenue pour ${user.email}: ${error.message}`
      );
    });

    return created(res, {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (err) {
    logger.error(`Erreur lors de l'inscription : ${err.message}`);
    return serverError(res, "Erreur serveur lors de l'inscription.");
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
      "SELECT id, pseudo, email, password, role, avatar, is_banned FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      logger.warn(`Tentative de connexion avec email inexistant : ${email}`);
      return unauthorized(res, "Email ou mot de passe incorrect.");
    }

    const user = result.rows[0];

    // Vérifier si l'utilisateur est banni
    if (user.is_banned) {
      logger.warn(`Utilisateur banni ${user.id} a tenté de se connecter`);
      return forbidden(res, "Votre compte a été banni par un administrateur.");
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Mot de passe incorrect pour : ${email}`);
      return unauthorized(res, "Email ou mot de passe incorrect.");
    }

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    logger.info(`Connexion réussie : ${user.id} (${user.pseudo})`);

    return success(res, {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    });
  } catch (err) {
    logger.error(`Erreur lors de la connexion : ${err.message}`);
    return serverError(res, "Erreur serveur lors de la connexion.");
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
      `SELECT id, pseudo, email, role, avatar, is_banned, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      logger.warn(`Profil introuvable : ${userId}`);
      return notFound(res, "Utilisateur introuvable.");
    }

    const user = result.rows[0];

    return success(res, {
      id: user.id,
      pseudo: user.pseudo,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isBanned: user.is_banned,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération du profil : ${err.message}`);
    return serverError(
      res,
      "Erreur serveur lors de la récupération du profil."
    );
  }
};

/**
 * Vérifier le statut de l'utilisateur (pour polling côté frontend)
 */
const checkStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT is_banned, ban_type, ban_reason, banned_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    const user = result.rows[0];

    // Retourner les infos de ban (le frontend gère l'affichage)
    return success(res, { 
      isBanned: user.is_banned,
      banType: user.ban_type,
      banReason: user.ban_reason,
      bannedAt: user.banned_at,
    });
  } catch (err) {
    logger.error(`Erreur checkStatus : ${err.message}`);
    return serverError(res);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, avatar } = req.body;

    logger.info(`Mise à jour du profil : ${userId}`);

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (email) {
      // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return conflict(res, "Cet email est déjà utilisé.");
      }

      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(avatar);
    }

    if (updates.length === 0) {
      return badRequest(res, "Aucune modification fournie.");
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} 
       WHERE id = $${paramIndex}
       RETURNING id, pseudo, email, avatar, role, updated_at`,
      values
    );

    const user = result.rows[0];

    logger.info(`Profil mis à jour avec succès : ${userId}`);

    return success(res, {
      id: user.id,
      pseudo: user.pseudo,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      updatedAt: user.updated_at,
    });
  } catch (err) {
    logger.error(`Erreur lors de la mise à jour du profil : ${err.message}`);
    return serverError(res, "Erreur serveur lors de la mise à jour.");
  }
};

/**
 * Mettre à jour le mot de passe
 */
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    logger.info(`Tentative de changement de mot de passe : ${userId}`);

    // Récupérer le mot de passe actuel
    const result = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return notFound(res, "Utilisateur introuvable.");
    }

    const user = result.rows[0];

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      logger.warn(`Mot de passe actuel incorrect pour : ${userId}`);
      return unauthorized(res, "Mot de passe actuel incorrect.");
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await pool.query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, userId]
    );

    logger.info(`Mot de passe mis à jour avec succès : ${userId}`);

    return success(res, {
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (err) {
    logger.error(`Erreur lors du changement de mot de passe : ${err.message}`);
    return serverError(res, "Erreur serveur lors de la mise à jour.");
  }
};

/**
 * Demander une réinitialisation de mot de passe
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    logger.info(`Demande de réinitialisation de mot de passe : ${email}`);

    // Vérifier si l'utilisateur existe
    const result = await pool.query(
      "SELECT id, pseudo, email FROM users WHERE email = $1",
      [email]
    );

    // Pour la sécurité, on retourne toujours succès même si l'email n'existe pas
    if (result.rows.length === 0) {
      logger.warn(`Email inexistant pour reset : ${email}`);
      return success(res, {
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé.",
      });
    }

    const user = result.rows[0];

    // Générer un token de réinitialisation (valide 1h)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Stocker le token dans la base de données
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    // Envoyer l'email en arrière-plan (ne pas attendre)
    sendPasswordResetEmail(user.email, resetToken, user.pseudo)
      .then(() => {
        logger.info(`Email de réinitialisation envoyé à ${user.id}`);
      })
      .catch((err) => {
        logger.error(
          `Erreur envoi email réinitialisation à ${user.email}: ${err.message}`
        );
      });

    // Répondre immédiatement sans attendre l'email
    return success(res, {
      message: "Si cet email existe, un lien de réinitialisation a été envoyé.",
    });
  } catch (err) {
    logger.error(`Erreur lors de la réinitialisation : ${err.message}`);
    return serverError(res, "Erreur lors de l'envoi de l'email.");
  }
};

/**
 * Réinitialiser le mot de passe avec le token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return badRequest(res, "Token et nouveau mot de passe requis.");
    }

    if (newPassword.length < 6) {
      return badRequest(
        res,
        "Le mot de passe doit contenir au moins 6 caractères."
      );
    }

    logger.info(`Tentative de reset avec token`);

    // Hasher le token reçu pour le comparer
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Trouver l'utilisateur avec ce token valide
    const result = await pool.query(
      `SELECT id, pseudo, email 
       FROM users 
       WHERE reset_token = $1 
       AND reset_token_expiry > NOW()`,
      [resetTokenHash]
    );

    if (result.rows.length === 0) {
      logger.warn(`Token invalide ou expiré`);
      return unauthorized(res, "Token invalide ou expiré.");
    }

    const user = result.rows[0];

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et supprimer le token
    await pool.query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL, 
           reset_token_expiry = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    logger.info(`Mot de passe réinitialisé pour ${user.id} (${user.pseudo})`);

    return success(res, {
      message: "Mot de passe réinitialisé avec succès.",
    });
  } catch (err) {
    logger.error(`Erreur lors du reset password : ${err.message}`);
    return serverError(res, "Erreur lors de la réinitialisation.");
  }
};

module.exports = {
  register,
  login,
  getProfile,
  checkStatus,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
};
