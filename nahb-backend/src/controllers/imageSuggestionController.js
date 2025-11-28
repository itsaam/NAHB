const themeService = require("../services/themeService");
const imageSuggestionService = require("../services/imageSuggestionService");
const { success, error } = require("../utils/responses");

/**
 * Proposer une image pour un thème
 */
const suggestImage = async (req, res) => {
  try {
    const { themeId, imageUrl } = req.body;
    const userId = req.user.id;

    if (!themeId || !imageUrl) {
      return error(res, "themeId et imageUrl sont requis", 400);
    }

    // Vérifier que le thème existe
    const themeExists = await themeService.exists(themeId);
    if (!themeExists) {
      return error(res, "Thème non trouvé", 404);
    }

    // Vérifier si cette image n'a pas déjà été proposée pour ce thème
    const existingSuggestion =
      await imageSuggestionService.findPendingByThemeAndUrl(themeId, imageUrl);
    if (existingSuggestion) {
      return error(res, "Cette image a déjà été proposée pour ce thème", 400);
    }

    // Vérifier si l'image n'existe pas déjà dans le catalogue
    const existsInCatalog = await themeService.imageExistsInCatalog(
      themeId,
      imageUrl
    );
    if (existsInCatalog) {
      return error(res, "Cette image existe déjà dans le catalogue", 400);
    }

    // Créer la suggestion
    const suggestion = await imageSuggestionService.create({
      themeId,
      imageUrl,
      suggestedBy: userId,
    });

    return success(
      res,
      {
        ...suggestion,
        message: "Image proposée avec succès ! Un admin va la valider.",
      },
      201
    );
  } catch (err) {
    console.error("Erreur suggestImage:", err.message, err.stack);
    return error(res, "Erreur serveur: " + err.message, 500);
  }
};

/**
 * Récupérer toutes les suggestions (admin) - avec filtres optionnels
 */
const getAllSuggestions = async (req, res) => {
  try {
    const { status, themeId } = req.query;

    const suggestions = await imageSuggestionService.findAll({
      status,
      themeId,
    });

    return success(res, suggestions);
  } catch (err) {
    console.error("Erreur getAllSuggestions:", err);
    return error(res, "Erreur serveur", 500);
  }
};

/**
 * Approuver une suggestion (admin)
 */
const approveSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Récupérer la suggestion
    const suggestion = await imageSuggestionService.findPendingById(id);

    if (!suggestion) {
      return error(res, "Suggestion non trouvée ou déjà traitée", 404);
    }

    // Ajouter l'image au catalogue du thème
    await themeService.addImage(suggestion.theme_id, {
      imageUrl: suggestion.image_url,
      altText: "Image suggérée par la communauté",
    });

    // Mettre à jour le statut de la suggestion
    await imageSuggestionService.approve(id, adminId);

    return success(res, {
      message: "Image approuvée et ajoutée au catalogue !",
    });
  } catch (err) {
    console.error("Erreur approveSuggestion:", err);
    return error(res, "Erreur serveur", 500);
  }
};

/**
 * Rejeter une suggestion (admin)
 */
const rejectSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await imageSuggestionService.reject(id, adminId);

    if (!result) {
      return error(res, "Suggestion non trouvée ou déjà traitée", 404);
    }

    return success(res, { message: "Image refusée" });
  } catch (err) {
    console.error("Erreur rejectSuggestion:", err);
    return error(res, "Erreur serveur", 500);
  }
};

/**
 * Mes suggestions (pour l'utilisateur)
 */
const getMySuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const suggestions = await imageSuggestionService.findByUser(userId);

    return success(res, suggestions);
  } catch (err) {
    console.error("Erreur getMySuggestions:", err);
    return error(res, "Erreur serveur", 500);
  }
};

module.exports = {
  suggestImage,
  getAllSuggestions,
  approveSuggestion,
  rejectSuggestion,
  getMySuggestions,
};
