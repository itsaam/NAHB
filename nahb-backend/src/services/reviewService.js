const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des reviews (PostgreSQL)
 */

const findByUserAndStory = async (userId, storyMongoId) => {
  const result = await pool.query(
    "SELECT id FROM reviews WHERE user_id = $1 AND story_mongo_id = $2",
    [userId, storyMongoId]
  );
  return result.rows[0] || null;
};

const create = async ({ userId, storyMongoId, rating, comment }) => {
  const result = await pool.query(
    `INSERT INTO reviews (user_id, story_mongo_id, rating, comment) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [userId, storyMongoId, rating, comment || null]
  );
  return result.rows[0];
};

const update = async (reviewId, { rating, comment }) => {
  const result = await pool.query(
    `UPDATE reviews 
     SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP 
     WHERE id = $3 
     RETURNING *`,
    [rating, comment || null, reviewId]
  );
  return result.rows[0];
};

const findById = async (reviewId) => {
  const result = await pool.query("SELECT * FROM reviews WHERE id = $1", [
    reviewId,
  ]);
  return result.rows[0] || null;
};

const deleteById = async (reviewId) => {
  await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);
};

const deleteByUserAndStory = async (userId, storyMongoId) => {
  const result = await pool.query(
    "DELETE FROM reviews WHERE user_id = $1 AND story_mongo_id = $2 RETURNING *",
    [userId, storyMongoId]
  );
  return result.rows[0] || null;
};

const findByStory = async (storyMongoId) => {
  const result = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, 
            u.id as user_id, u.pseudo 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.story_mongo_id = $1 
     ORDER BY r.created_at DESC`,
    [storyMongoId]
  );
  return result.rows;
};

const findByUser = async (userId) => {
  const result = await pool.query(
    `SELECT r.id, r.story_mongo_id, r.rating, r.comment, r.created_at 
     FROM reviews r 
     WHERE r.user_id = $1 
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getStoryRatingStats = async (storyMongoId) => {
  const result = await pool.query(
    "SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as count FROM reviews WHERE story_mongo_id = $1",
    [storyMongoId]
  );
  return {
    average: parseFloat(result.rows[0].avg_rating) || 0,
    count: parseInt(result.rows[0].count) || 0,
  };
};

const getGlobalStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_reviews,
      AVG(rating) as average_rating
    FROM reviews
  `);
  return {
    total: parseInt(result.rows[0].total_reviews),
    averageRating: parseFloat(result.rows[0].average_rating || 0).toFixed(2),
  };
};

module.exports = {
  findByUserAndStory,
  create,
  update,
  findById,
  deleteById,
  deleteByUserAndStory,
  findByStory,
  findByUser,
  getStoryRatingStats,
  getGlobalStats,
};
