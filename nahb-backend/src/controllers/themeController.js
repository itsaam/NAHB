const { pool } = require("../config/postgresql");
const logger = require("../utils/logger");

/**
 * Récupérer tous les thèmes
 */
const getAllThemes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
        COALESCE(
          (SELECT json_agg(json_build_object('id', ti.id, 'image_url', ti.image_url, 'alt_text', ti.alt_text))
           FROM theme_images ti WHERE ti.theme_id = t.id), 
          '[]'
        ) as images
      FROM themes t
      ORDER BY t.name
    `);

    res.json({
      success: true,
      data: result.rows,
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

    const result = await pool.query(
      `SELECT t.*, 
        COALESCE(
          (SELECT json_agg(json_build_object('id', ti.id, 'image_url', ti.image_url, 'alt_text', ti.alt_text))
           FROM theme_images ti WHERE ti.theme_id = t.id), 
          '[]'
        ) as images
      FROM themes t
      WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
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

    const result = await pool.query(
      `INSERT INTO themes (name, description, default_image) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, default_image]
    );

    logger.info(`Thème créé: ${name}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
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

    const result = await pool.query(
      `UPDATE themes 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           default_image = COALESCE($3, default_image)
       WHERE id = $4
       RETURNING *`,
      [name, description, default_image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    logger.info(`Thème modifié: ${id}`);

    res.json({
      success: true,
      data: result.rows[0],
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

    const result = await pool.query(
      "DELETE FROM themes WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
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
    const themeCheck = await pool.query("SELECT id FROM themes WHERE id = $1", [
      id,
    ]);
    if (themeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Thème introuvable",
      });
    }

    const result = await pool.query(
      `INSERT INTO theme_images (theme_id, image_url, alt_text) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [id, image_url, alt_text]
    );

    logger.info(`Image ajoutée au thème ${id}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
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

    const result = await pool.query(
      "DELETE FROM theme_images WHERE id = $1 RETURNING *",
      [imageId]
    );

    if (result.rows.length === 0) {
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

    let query = `
      SELECT ti.*, t.name as theme_name 
      FROM theme_images ti
      JOIN themes t ON ti.theme_id = t.id
    `;
    const params = [];

    if (theme_id) {
      query += " WHERE ti.theme_id = $1";
      params.push(theme_id);
    }

    query += " ORDER BY t.name, ti.created_at DESC";

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
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
