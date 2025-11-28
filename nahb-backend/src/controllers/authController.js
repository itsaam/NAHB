const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userService = require("../services/userService");
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
    const { pseudo, email, password, role } = req.body;

    logger.info(`Tentative d'inscription : ${email}`);

    // Vérifier si l'email existe déjà
    const emailExists = await userService.findByEmail(email);
    if (emailExists) {
      logger.warn(`Email déjà utilisé : ${email}`);
      return conflict(res, "Ces identifiants sont déjà utilisés.");
    }

    // Vérifier si le pseudo existe déjà
    const pseudoExists = await userService.findByPseudo(pseudo);
    if (pseudoExists) {
      logger.warn(`Pseudo déjà utilisé : ${pseudo}`);
      return conflict(res, "Ces identifiants sont déjà utilisés.");
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await userService.create({
      pseudo,
      email,
      hashedPassword,
      role: role || "lecteur",
    });

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
    const user = await userService.findByEmail(email);

    if (!user) {
      logger.warn(`Tentative de connexion avec email inexistant : ${email}`);
      return unauthorized(res, "Email ou mot de passe incorrect.");
    }

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

    const user = await userService.findById(userId);

    if (!user) {
      logger.warn(`Profil introuvable : ${userId}`);
      return notFound(res, "Utilisateur introuvable.");
    }

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

    const banStatus = await userService.getBanStatus(userId);

    if (!banStatus) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    return success(res, {
      isBanned: banStatus.is_banned,
      banType: banStatus.ban_type,
      banReason: banStatus.ban_reason,
      bannedAt: banStatus.banned_at,
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

    if (email) {
      const emailExists = await userService.checkEmailExists(email, userId);
      if (emailExists) {
        return conflict(res, "Cet email est déjà utilisé.");
      }
    }

    if (!email && avatar === undefined) {
      return badRequest(res, "Aucune modification fournie.");
    }

    const user = await userService.updateProfile(userId, { email, avatar });

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
    const storedPassword = await userService.getPassword(userId);

    if (!storedPassword) {
      return notFound(res, "Utilisateur introuvable.");
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      storedPassword
    );

    if (!isPasswordValid) {
      logger.warn(`Mot de passe actuel incorrect pour : ${userId}`);
      return unauthorized(res, "Mot de passe actuel incorrect.");
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await userService.updatePassword(userId, hashedPassword);

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
    const user = await userService.findByEmail(email);

    // Pour la sécurité, on retourne toujours succès même si l'email n'existe pas
    if (!user) {
      logger.warn(`Email inexistant pour reset : ${email}`);
      return success(res, {
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé.",
      });
    }

    // Générer un token de réinitialisation (valide 1h)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Stocker le token dans la base de données
    await userService.setResetToken(user.id, resetTokenHash, resetTokenExpiry);

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
    const user = await userService.findByResetToken(resetTokenHash);

    if (!user) {
      logger.warn(`Token invalide ou expiré`);
      return unauthorized(res, "Token invalide ou expiré.");
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et supprimer le token
    await userService.clearResetToken(user.id, hashedPassword);

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
