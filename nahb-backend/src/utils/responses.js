/**
 * Helpers pour standardiser les réponses HTTP (DRY)
 * Évite la répétition de res.status().json() partout
 */

/**
 * Réponse de succès
 * @param {Object} res - Objet response Express
 * @param {*} data - Données à renvoyer
 * @param {number} status - Code HTTP (200 par défaut)
 */
const success = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

/**
 * Réponse d'erreur
 * @param {Object} res - Objet response Express
 * @param {string} message - Message d'erreur
 * @param {number} status - Code HTTP (500 par défaut)
 * @param {*} details - Détails additionnels (optionnel)
 */
const error = (res, message, status = 500, details = null) => {
  const response = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  return res.status(status).json(response);
};

/**
 * Réponse de succès pour création (201)
 */
const created = (res, data) => success(res, data, 201);

/**
 * Réponse d'erreur 400 (Bad Request)
 */
const badRequest = (res, message, details = null) =>
  error(res, message, 400, details);

/**
 * Réponse d'erreur 401 (Unauthorized)
 */
const unauthorized = (res, message = "Non autorisé.") =>
  error(res, message, 401);

/**
 * Réponse d'erreur 403 (Forbidden)
 */
const forbidden = (res, message = "Accès interdit.") =>
  error(res, message, 403);

/**
 * Réponse d'erreur 404 (Not Found)
 */
const notFound = (res, message = "Ressource introuvable.") =>
  error(res, message, 404);

/**
 * Réponse d'erreur 409 (Conflict)
 */
const conflict = (res, message) => error(res, message, 409);

/**
 * Réponse d'erreur 500 (Internal Server Error)
 */
const serverError = (res, message = "Erreur serveur.") =>
  error(res, message, 500);

module.exports = {
  success,
  error,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
};
