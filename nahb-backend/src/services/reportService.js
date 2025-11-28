const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des signalements (PostgreSQL)
 */

const create = async ({ userId, storyMongoId, reason }) => {
  const result = await pool.query(
    `INSERT INTO reports (user_id, story_mongo_id, reason, status) 
     VALUES ($1, $2, $3, 'pending') 
     RETURNING id, user_id, story_mongo_id, reason, status, created_at`,
    [userId, storyMongoId, reason]
  );
  return result.rows[0];
};

const findById = async (reportId) => {
  const result = await pool.query("SELECT * FROM reports WHERE id = $1", [
    reportId,
  ]);
  return result.rows[0] || null;
};

const findByUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, story_mongo_id, reason, status, created_at
     FROM reports
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const findAll = async (status = null) => {
  let query = "SELECT * FROM reports ORDER BY created_at DESC";
  const params = [];

  if (status) {
    query = "SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC";
    params.push(status);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

const updateStatus = async (reportId, status) => {
  await pool.query("UPDATE reports SET status = $1 WHERE id = $2", [
    status,
    reportId,
  ]);
};

const countResolvedByStory = async (storyMongoId) => {
  const result = await pool.query(
    "SELECT COUNT(*) as count FROM reports WHERE story_mongo_id = $1 AND status = 'resolved'",
    [storyMongoId]
  );
  return parseInt(result.rows[0].count);
};

const getGlobalStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_reports,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_reports
    FROM reports
  `);
  return result.rows[0];
};

module.exports = {
  create,
  findById,
  findByUser,
  findAll,
  updateStatus,
  countResolvedByStory,
  getGlobalStats,
};
