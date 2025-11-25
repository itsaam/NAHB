const { forbidden } = require("../utils/responses");

/**
 * Middleware générique pour vérifier la propriété d'une ressource
 * Évite de répéter la vérification authorPostgresId !== userId partout (DRY)
 *
 * @param {Function} resourceGetter - Fonction async qui récupère la ressource (req => Promise<resource>)
 * @param {string} ownerField - Nom du champ contenant l'ID du propriétaire (par défaut 'authorPostgresId')
 * @returns {Function} Middleware Express
 */
const checkOwnership = (resourceGetter, ownerField = "authorPostgresId") => {
  return async (req, res, next) => {
    try {
      const resource = await resourceGetter(req);

      if (!resource) {
        return forbidden(res, "Ressource introuvable.");
      }

      // Les admins ont accès à tout
      if (req.user.role === "admin") {
        req.resource = resource;
        return next();
      }

      // Vérifier la propriété
      if (resource[ownerField] !== req.user.id) {
        return forbidden(
          res,
          "Vous n'êtes pas autorisé à accéder à cette ressource."
        );
      }

      // Attacher la ressource à req pour éviter de la re-fetcher
      req.resource = resource;
      next();
    } catch (err) {
      return forbidden(res, "Erreur lors de la vérification des permissions.");
    }
  };
};

module.exports = checkOwnership;
