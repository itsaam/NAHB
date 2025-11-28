const themeService = require("../services/themeService");
const logger = require("../utils/logger");

/**
 * Récupérer tous les thèmes
 */
const getAllThemes = async (req, res) => {
  try {
    const themes = await themeService.findAll();

    res.json({
      success: true,
      data: themes,
    });
  } catch (err) {
    logger.error(`Erreur getAllThemes: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Récupérer un thème par ID
 */
const getThemeById = async (req, res) => {
  try {
    const { id } = req.params;

    const theme = await themeService.findById(id);

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    res.json({
      success: true,
      data: theme,
    });
  } catch (err) {
    logger.error(`Erreur getThemeById: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Créer un thème (admin)
 */
const createTheme = async (req, res) => {
  try {
    const { name, description, default_image } = req.body;

    const theme = await themeService.create({
      name,
      description,
      defaultImage: default_image,
    });

    logger.info(`Thème créé: ${name}`);

    res.status(201).json({
      success: true,
      data: theme,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        error: "Ce thème existe déjà",
      });
    }
    logger.error(`Erreur createTheme: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Modifier un thème (admin)
 */
const updateTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, default_image } = req.body;

    const theme = await themeService.update(id, {
      name,
      description,
      defaultImage: default_image,
    });

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    logger.info(`Thème modifié: ${id}`);

    res.json({
      success: true,
      data: theme,
    });
  } catch (err) {
    logger.error(`Erreur updateTheme: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Supprimer un thème (admin)
 */
const deleteTheme = async (req, res) => {
  try {
    const { id } = req.params;

    const theme = await themeService.deleteById(id);

    if (!theme) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    logger.info(`Thème supprimé: ${id}`);

    res.json({
      success: true,
      message: "Thème supprimé",
    });
  } catch (err) {
    logger.error(`Erreur deleteTheme: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Ajouter une image au catalogue d'un thème (admin)
 */
const addImageToTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, alt_text } = req.body;

    // Vérifier que le thème existe
    const themeExists = await themeService.exists(id);
    if (!themeExists) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    const image = await themeService.addImage(id, {
      imageUrl: image_url,
      altText: alt_text,
    });

    logger.info(`Image ajoutée au thème ${id}`);

    res.status(201).json({
      success: true,
      data: image,
    });
  } catch (err) {
    logger.error(`Erreur addImageToTheme: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Supprimer une image du catalogue (admin)
 */
const deleteThemeImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await themeService.deleteImage(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: "Image introuvable",
      });
    }

    logger.info(`Image supprimée: ${imageId}`);

    res.json({
      success: true,
      message: "Image supprimée",
    });
  } catch (err) {
    logger.error(`Erreur deleteThemeImage: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

/**
 * Récupérer toutes les images (pour le catalogue global)
 */
const getAllImages = async (req, res) => {
  try {
    const { theme_id } = req.query;

    const images = await themeService.getAllImages(theme_id);

    res.json({
      success: true,
      data: images,
    });
  } catch (err) {
    logger.error(`Erreur getAllImages: ${err.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

module.exports = {
  getAllThemes,
  getThemeById,
  createTheme,
  updateTheme,
  deleteTheme,
  addImageToTheme,
  deleteThemeImage,
  getAllImages,
};
