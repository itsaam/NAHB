const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des sessions de jeu (PostgreSQL)
 */

const findActiveSession = async (userId, storyMongoId) => {
  const result = await pool.query(
    `SELECT * FROM game_sessions 
     WHERE user_id = $1 AND story_mongo_id = $2 AND is_completed = false 
     ORDER BY updated_at DESC LIMIT 1`,
    [userId, storyMongoId]
  );
  return result.rows[0] || null;
};

const findById = async (sessionId) => {
  const result = await pool.query("SELECT * FROM game_sessions WHERE id = $1", [
    sessionId,
  ]);
  return result.rows[0] || null;
};

const create = async ({
  userId,
  storyMongoId,
  currentPageMongoId,
  isPreview = false,
}) => {
  const result = await pool.query(
    `INSERT INTO game_sessions (user_id, story_mongo_id, current_page_mongo_id, is_preview) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, user_id, story_mongo_id, current_page_mongo_id, is_completed, started_at`,
    [userId, storyMongoId, currentPageMongoId, isPreview]
  );
  return result.rows[0];
};

const updateCurrentPage = async (
  sessionId,
  { currentPageMongoId, isCompleted, endPageMongoId }
) => {
  await pool.query(
    `UPDATE game_sessions 
     SET current_page_mongo_id = $1, 
         is_completed = $2, 
         end_page_mongo_id = $3,
         completed_at = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [
      currentPageMongoId,
      isCompleted,
      endPageMongoId,
      isCompleted ? new Date() : null,
      sessionId,
    ]
  );
};

const findByUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, story_mongo_id, current_page_mongo_id, is_completed, started_at, completed_at 
     FROM game_sessions 
     WHERE user_id = $1 
     ORDER BY started_at DESC`,
    [userId]
  );
  return result.rows;
};

const getUserActivities = async (userId) => {
  const result = await pool.query(
    `SELECT 
      gs.story_mongo_id,
      gs.is_completed,
      MAX(gs.id) as last_session_id,
      MAX(gs.updated_at) as last_updated,
      COUNT(DISTINCT gs.id) as total_sessions,
      COUNT(DISTINCT CASE WHEN gs.is_completed = true THEN gs.end_page_mongo_id END) as unique_endings
     FROM game_sessions gs
     WHERE gs.user_id = $1
     GROUP BY gs.story_mongo_id, gs.is_completed
     ORDER BY MAX(gs.updated_at) DESC`,
    [userId]
  );
  return result.rows;
};

const getGlobalStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE is_completed = TRUE) as completed_sessions
    FROM game_sessions
  `);
  return result.rows[0];
};

module.exports = {
  findActiveSession,
  findById,
  create,
  updateCurrentPage,
  findByUser,
  getUserActivities,
  getGlobalStats,
};
