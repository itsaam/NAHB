const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des thèmes (PostgreSQL)
 */

const findAll = async () => {
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
  return result.rows;
};

const findById = async (id) => {
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
  return result.rows[0] || null;
};

const exists = async (id) => {
  const result = await pool.query("SELECT id FROM themes WHERE id = $1", [id]);
  return result.rows.length > 0;
};

const create = async ({ name, description, defaultImage }) => {
  const result = await pool.query(
    `INSERT INTO themes (name, description, default_image) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [name, description, defaultImage]
  );
  return result.rows[0];
};

const update = async (id, { name, description, defaultImage }) => {
  const result = await pool.query(
    `UPDATE themes 
     SET name = COALESCE($1, name), 
         description = COALESCE($2, description),
         default_image = COALESCE($3, default_image)
     WHERE id = $4
     RETURNING *`,
    [name, description, defaultImage, id]
  );
  return result.rows[0] || null;
};

const deleteById = async (id) => {
  const result = await pool.query(
    "DELETE FROM themes WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
};

// Theme images
const addImage = async (themeId, { imageUrl, altText }) => {
  const result = await pool.query(
    `INSERT INTO theme_images (theme_id, image_url, alt_text) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [themeId, imageUrl, altText]
  );
  return result.rows[0];
};

const deleteImage = async (imageId) => {
  const result = await pool.query(
    "DELETE FROM theme_images WHERE id = $1 RETURNING *",
    [imageId]
  );
  return result.rows[0] || null;
};

const getAllImages = async (themeId = null) => {
  let query = `
    SELECT ti.*, t.name as theme_name 
    FROM theme_images ti
    JOIN themes t ON ti.theme_id = t.id
  `;
  const params = [];

  if (themeId) {
    query += " WHERE ti.theme_id = $1";
    params.push(themeId);
  }

  query += " ORDER BY t.name, ti.created_at DESC";

  const result = await pool.query(query, params);
  return result.rows;
};

const imageExistsInCatalog = async (themeId, imageUrl) => {
  const result = await pool.query(
    "SELECT id FROM theme_images WHERE theme_id = $1 AND image_url = $2",
    [themeId, imageUrl]
  );
  return result.rows.length > 0;
};

module.exports = {
  findAll,
  findById,
  exists,
  create,
  update,
  deleteById,
  addImage,
  deleteImage,
  getAllImages,
  imageExistsInCatalog,
};
