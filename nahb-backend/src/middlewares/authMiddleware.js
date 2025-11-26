const jwt = require("jsonwebtoken");
const { pool } = require("../config/postgresql");
const logger = require("../utils/logger");

/**
 * Middleware d'authentification JWT
 * Vérifie le token et ajoute les infos user à req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Tentative d'accès sans token JWT");
      return res.status(401).json({
        success: false,
        error: "Token manquant. Authentification requise.",
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis PostgreSQL
    const result = await pool.query(
      "SELECT id, pseudo, email, role, is_banned, ban_type, ban_reason FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      logger.warn(
        `Token valide mais utilisateur ${decoded.userId} introuvable`
      );
      return res.status(401).json({
        success: false,
        error: "Utilisateur introuvable.",
      });
    }

    const user = result.rows[0];

    // Vérifier si l'utilisateur est complètement banni (ban_type = 'full')
    if (user.is_banned && user.ban_type === "full") {
      logger.warn(
        `Utilisateur banni (full) ${user.id} a tenté de se connecter`
      );
      return res.status(403).json({
        success: false,
        error: "Votre compte a été banni par un administrateur.",
        banType: "full",
        banReason: user.ban_reason,
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      logger.warn("Token JWT invalide");
      return res.status(401).json({
        success: false,
        error: "Token invalide.",
      });
    }

    if (err.name === "TokenExpiredError") {
      logger.warn("Token JWT expiré");
      return res.status(401).json({
        success: false,
        error: "Token expiré. Veuillez vous reconnecter.",
      });
    }

    logger.error(`Erreur middleware auth : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'authentification.",
    });
  }
};

/**
 * Middleware d'authentification optionnelle
 * Ajoute req.user si un token valide est présent, sinon continue sans erreur
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Pas de token, on continue sans user
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await pool.query(
        "SELECT id, pseudo, email, role, is_banned FROM users WHERE id = $1",
        [decoded.userId]
      );

      if (result.rows.length > 0 && !result.rows[0].is_banned) {
        req.user = result.rows[0];
      }
    } catch (err) {
      // Token invalide ou expiré, on continue sans user
      logger.debug(`Token invalide ou expiré (optionalAuth): ${err.message}`);
    }

    next();
  } catch (err) {
    logger.error(`Erreur middleware optionalAuth : ${err.message}`);
    next(); // Continue même en cas d'erreur
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn("requireAdmin appelé sans authentification préalable");
      return res.status(401).json({
        success: false,
        error: "Authentification requise.",
      });
    }

    if (req.user.role !== "admin") {
      logger.warn(
        `Utilisateur ${req.user.id} a tenté d'accéder à une route admin`
      );
      return res.status(403).json({
        success: false,
        error: "Accès refusé. Privilèges administrateur requis.",
      });
    }

    next();
  } catch (err) {
    logger.error(`Erreur middleware requireAdmin : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la vérification des droits.",
    });
  }
};

/**
 * Middleware pour vérifier le rôle auteur
 */
const requireAuthor = (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn("requireAuthor appelé sans authentification préalable");
      return res.status(401).json({
        success: false,
        error: "Authentification requise.",
      });
    }

    if (req.user.role !== "auteur" && req.user.role !== "admin") {
      logger.warn(
        `Utilisateur ${req.user.id} (${req.user.role}) a tenté d'accéder à une route auteur`
      );
      return res.status(403).json({
        success: false,
        error:
          "Accès refusé. Vous devez être auteur pour accéder à cette ressource.",
      });
    }

    next();
  } catch (err) {
    logger.error(`Erreur middleware requireAuthor : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la vérification des droits.",
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur peut créer/modifier des histoires
 * Bloque si ban_type = 'author' ou 'full'
 */
const canCreateStory = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentification requise.",
      });
    }

    if (
      req.user.is_banned &&
      (req.user.ban_type === "author" || req.user.ban_type === "full")
    ) {
      logger.warn(
        `Utilisateur banni (${req.user.ban_type}) ${req.user.id} a tenté de créer une histoire`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes plus autorisé à créer ou modifier des histoires.",
        banType: req.user.ban_type,
        banReason: req.user.ban_reason,
      });
    }

    next();
  } catch (err) {
    logger.error(`Erreur middleware canCreateStory : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la vérification des droits.",
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur peut commenter
 * Bloque si ban_type = 'comment' ou 'full'
 */
const canComment = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentification requise.",
      });
    }

    if (
      req.user.is_banned &&
      (req.user.ban_type === "comment" || req.user.ban_type === "full")
    ) {
      logger.warn(
        `Utilisateur banni (${req.user.ban_type}) ${req.user.id} a tenté de commenter`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes plus autorisé à poster des commentaires.",
        banType: req.user.ban_type,
        banReason: req.user.ban_reason,
      });
    }

    next();
  } catch (err) {
    logger.error(`Erreur middleware canComment : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la vérification des droits.",
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireAuthor,
  canCreateStory,
  canComment,
};
