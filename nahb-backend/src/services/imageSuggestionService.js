const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des suggestions d'images (PostgreSQL)
 */

const create = async ({ themeId, imageUrl, suggestedBy }) => {
  const result = await pool.query(
    `INSERT INTO image_suggestions (theme_id, image_url, suggested_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [themeId, imageUrl, suggestedBy]
  );
  return result.rows[0];
};

const findPendingByThemeAndUrl = async (themeId, imageUrl) => {
  const result = await pool.query(
    "SELECT id FROM image_suggestions WHERE theme_id = $1 AND image_url = $2 AND status = 'pending'",
    [themeId, imageUrl]
  );
  return result.rows[0] || null;
};

const findPendingById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM image_suggestions WHERE id = $1 AND status = 'pending'",
    [id]
  );
  return result.rows[0] || null;
};

const findAll = async ({ status, themeId } = {}) => {
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
  return result.rows;
};

const findByUser = async (userId) => {
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
  return result.rows;
};

const approve = async (id, adminId) => {
  await pool.query(
    `UPDATE image_suggestions 
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2`,
    [adminId, id]
  );
};

const reject = async (id, adminId) => {
  const result = await pool.query(
    `UPDATE image_suggestions 
     SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2 AND status = 'pending'
     RETURNING *`,
    [adminId, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  create,
  findPendingByThemeAndUrl,
  findPendingById,
  findAll,
  findByUser,
  approve,
  reject,
};
