const { pool } = require("../config/postgresql");
const { success, error } = require("../utils/responses");

// Proposer une image pour un thème
const suggestImage = async (req, res) => {
  try {
    const { themeId, imageUrl } = req.body;
    const userId = req.user.id;

    if (!themeId || !imageUrl) {
      return error(res, "themeId et imageUrl sont requis", 400);
    }

    // Vérifier que le thème existe
    const themeCheck = await pool.query("SELECT id FROM themes WHERE id = $1", [
      themeId,
    ]);
    if (themeCheck.rows.length === 0) {
      return error(res, "Thème non trouvé", 404);
    }

    // Vérifier si cette image n'a pas déjà été proposée pour ce thème
    const existingCheck = await pool.query(
      "SELECT id FROM image_suggestions WHERE theme_id = $1 AND image_url = $2 AND status = 'pending'",
      [themeId, imageUrl]
    );
    if (existingCheck.rows.length > 0) {
      return error(res, "Cette image a déjà été proposée pour ce thème", 400);
    }

    // Vérifier si l'image n'existe pas déjà dans le catalogue
    const catalogCheck = await pool.query(
      "SELECT id FROM theme_images WHERE theme_id = $1 AND image_url = $2",
      [themeId, imageUrl]
    );
    if (catalogCheck.rows.length > 0) {
      return error(res, "Cette image existe déjà dans le catalogue", 400);
    }

    // Créer la suggestion
    const result = await pool.query(
      `INSERT INTO image_suggestions (theme_id, image_url, suggested_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [themeId, imageUrl, userId]
    );

    return success(
      res,
      {
        ...result.rows[0],
        message: "Image proposée avec succès ! Un admin va la valider.",
      },
      201
    );
  } catch (err) {
    console.error("Erreur suggestImage:", err.message, err.stack);
    return error(res, "Erreur serveur: " + err.message, 500);
  }
};

// Récupérer toutes les suggestions (admin) - avec filtres optionnels
const getAllSuggestions = async (req, res) => {
  try {
    const { status, themeId } = req.query;

    let query = `
      SELECT 
        s.id,
        s.image_url,
        s.status,
        s.created_at,
        s.reviewed_at,
        t.id as theme_id,
        t.name as theme_name,
        u.id as user_id,
        u.pseudo as user_pseudo,
        r.pseudo as reviewer_pseudo
       FROM image_suggestions s
       JOIN themes t ON s.theme_id = t.id
       JOIN users u ON s.suggested_by = u.id
       LEFT JOIN users r ON s.reviewed_by = r.id
       WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    if (themeId) {
      params.push(themeId);
      query += ` AND s.theme_id = $${params.length}`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, params);

    return success(res, result.rows);
  } catch (err) {
    console.error("Erreur getAllSuggestions:", err);
    return error(res, "Erreur serveur", 500);
  }
};

// Approuver une suggestion (admin)
const approveSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Récupérer la suggestion
    const suggestionResult = await pool.query(
      "SELECT * FROM image_suggestions WHERE id = $1 AND status = 'pending'",
      [id]
    );

    if (suggestionResult.rows.length === 0) {
      return error(res, "Suggestion non trouvée ou déjà traitée", 404);
    }

    const suggestion = suggestionResult.rows[0];

    // Ajouter l'image au catalogue du thème
    await pool.query(
      `INSERT INTO theme_images (theme_id, image_url, alt_text)
       VALUES ($1, $2, $3)`,
      [
        suggestion.theme_id,
        suggestion.image_url,
        "Image suggérée par la communauté",
      ]
    );

    // Mettre à jour le statut de la suggestion
    await pool.query(
      `UPDATE image_suggestions 
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [adminId, id]
    );

    return success(res, {
      message: "Image approuvée et ajoutée au catalogue !",
    });
  } catch (err) {
    console.error("Erreur approveSuggestion:", err);
    return error(res, "Erreur serveur", 500);
  }
};

// Rejeter une suggestion (admin)
const rejectSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await pool.query(
      `UPDATE image_suggestions 
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [adminId, id]
    );

    if (result.rows.length === 0) {
      return error(res, "Suggestion non trouvée ou déjà traitée", 404);
    }

    return success(res, { message: "Image refusée" });
  } catch (err) {
    console.error("Erreur rejectSuggestion:", err);
    return error(res, "Erreur serveur", 500);
  }
};

// Mes suggestions (pour l'utilisateur)
const getMySuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        s.id,
        s.image_url,
        s.status,
        s.created_at,
        s.reviewed_at,
        t.name as theme_name
       FROM image_suggestions s
       JOIN themes t ON s.theme_id = t.id
       WHERE s.suggested_by = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return success(res, result.rows);
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
