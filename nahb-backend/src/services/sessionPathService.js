const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des chemins de session (PostgreSQL)
 */

const addStep = async (sessionId, pageMongoId, choiceMongoId) => {
  await pool.query(
    `INSERT INTO session_paths (session_id, page_mongo_id, choice_mongo_id, step_order)
     VALUES ($1, $2, $3, (SELECT COALESCE(MAX(step_order), 0) + 1 FROM session_paths WHERE session_id = $1))`,
    [sessionId, pageMongoId, choiceMongoId]
  );
};

const getBySession = async (sessionId) => {
  const result = await pool.query(
    `SELECT page_mongo_id, choice_mongo_id, step_order, created_at 
     FROM session_paths 
     WHERE session_id = $1 
     ORDER BY step_order ASC`,
    [sessionId]
  );
  return result.rows;
};

const getAllPathsByStory = async (storyMongoId) => {
  const result = await pool.query(
    `SELECT sp.session_id, sp.page_mongo_id, sp.step_order
     FROM session_paths sp
     JOIN game_sessions gs ON sp.session_id = gs.id
     WHERE gs.story_mongo_id = $1
     ORDER BY sp.session_id, sp.step_order`,
    [storyMongoId]
  );
  return result.rows;
};

module.exports = {
  addStep,
  getBySession,
  getAllPathsByStory,
};
