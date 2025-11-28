const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des fins débloquées (PostgreSQL)
 */

const unlock = async (userId, storyMongoId, pageMongoId) => {
  await pool.query(
    `INSERT INTO unlocked_endings (user_id, story_mongo_id, page_mongo_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, story_mongo_id, page_mongo_id) DO NOTHING`,
    [userId, storyMongoId, pageMongoId]
  );
};

const findByUserAndStory = async (userId, storyMongoId) => {
  const result = await pool.query(
    `SELECT ue.end_page_mongo_id, ue.unlocked_at 
     FROM unlocked_endings ue
     WHERE ue.user_id = $1 AND ue.story_mongo_id = $2
     ORDER BY ue.unlocked_at DESC`,
    [userId, storyMongoId]
  );
  return result.rows;
};

const getEndPageIdsByUserAndStory = async (userId, storyMongoId) => {
  const result = await pool.query(
    `SELECT end_page_mongo_id FROM unlocked_endings 
     WHERE user_id = $1 AND story_mongo_id = $2`,
    [userId, storyMongoId]
  );
  return result.rows.map((row) => row.end_page_mongo_id);
};

const getByUserAndStory = async (userId, storyMongoId) => {
  const result = await pool.query(
    `SELECT page_mongo_id, unlocked_at 
     FROM unlocked_endings 
     WHERE user_id = $1 AND story_mongo_id = $2
     ORDER BY unlocked_at DESC`,
    [userId, storyMongoId]
  );
  return result.rows;
};

const getEndingStats = async (storyMongoId, endPageMongoId) => {
  const endStatsResult = await pool.query(
    `SELECT COUNT(*) as count
     FROM game_sessions
     WHERE story_mongo_id = $1 AND end_page_mongo_id = $2 AND is_completed = true`,
    [storyMongoId, endPageMongoId]
  );

  const totalCompleted = await pool.query(
    `SELECT COUNT(*) as count
     FROM game_sessions
     WHERE story_mongo_id = $1 AND is_completed = true`,
    [storyMongoId]
  );

  const endCount = parseInt(endStatsResult.rows[0].count);
  const totalCount = parseInt(totalCompleted.rows[0].count);

  return {
    timesReached: endCount,
    percentage: totalCount > 0 ? Math.round((endCount / totalCount) * 100) : 0,
    totalCompleted: totalCount,
  };
};

module.exports = {
  unlock,
  findByUserAndStory,
  getEndPageIdsByUserAndStory,
  getByUserAndStory,
  getEndingStats,
};
