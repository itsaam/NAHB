const { pool } = require("../config/postgresql");

/**
 * Service pour la gestion des utilisateurs (PostgreSQL)
 */

const findByEmail = async (email) => {
  const result = await pool.query(
    "SELECT id, pseudo, email, password, role, avatar, is_banned, ban_type, ban_reason, banned_at FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0] || null;
};

const findByPseudo = async (pseudo) => {
  const result = await pool.query("SELECT id FROM users WHERE pseudo = $1", [
    pseudo,
  ]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT id, pseudo, email, role, avatar, is_banned, ban_type, ban_reason, banned_at, created_at, updated_at 
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async ({ pseudo, email, hashedPassword, role = "lecteur" }) => {
  const result = await pool.query(
    `INSERT INTO users (pseudo, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, pseudo, email, role, avatar, created_at`,
    [pseudo, email, hashedPassword, role]
  );
  return result.rows[0];
};

const updateProfile = async (userId, updates) => {
  const { email, avatar } = updates;
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  if (email) {
    setClauses.push(`email = $${paramIndex++}`);
    values.push(email);
  }

  if (avatar !== undefined) {
    setClauses.push(`avatar = $${paramIndex++}`);
    values.push(avatar);
  }

  if (setClauses.length === 0) {
    return null;
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await pool.query(
    `UPDATE users SET ${setClauses.join(", ")} 
     WHERE id = $${paramIndex}
     RETURNING id, pseudo, email, avatar, role, updated_at`,
    values
  );
  return result.rows[0];
};

const updatePassword = async (userId, hashedPassword) => {
  await pool.query(
    "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
    [hashedPassword, userId]
  );
};

const getPassword = async (userId) => {
  const result = await pool.query("SELECT password FROM users WHERE id = $1", [
    userId,
  ]);
  return result.rows[0]?.password || null;
};

const setResetToken = async (userId, resetTokenHash, resetTokenExpiry) => {
  await pool.query(
    `UPDATE users 
     SET reset_token = $1, reset_token_expiry = $2 
     WHERE id = $3`,
    [resetTokenHash, resetTokenExpiry, userId]
  );
};

const findByResetToken = async (resetTokenHash) => {
  const result = await pool.query(
    `SELECT id, pseudo, email 
     FROM users 
     WHERE reset_token = $1 
     AND reset_token_expiry > NOW()`,
    [resetTokenHash]
  );
  return result.rows[0] || null;
};

const clearResetToken = async (userId, hashedPassword) => {
  await pool.query(
    `UPDATE users 
     SET password = $1, 
         reset_token = NULL, 
         reset_token_expiry = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [hashedPassword, userId]
  );
};

const checkEmailExists = async (email, excludeUserId = null) => {
  let query = "SELECT id FROM users WHERE email = $1";
  const params = [email];

  if (excludeUserId) {
    query += " AND id != $2";
    params.push(excludeUserId);
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

const getBanStatus = async (userId) => {
  const result = await pool.query(
    "SELECT is_banned, ban_type, ban_reason, banned_at FROM users WHERE id = $1",
    [userId]
  );
  return result.rows[0] || null;
};

// Admin functions
const findAll = async () => {
  const result = await pool.query(`
    SELECT id, pseudo, email, role, is_banned, ban_type, ban_reason, banned_at, created_at 
    FROM users 
    ORDER BY created_at DESC
  `);
  return result.rows;
};

const ban = async (userId, banType, reason) => {
  await pool.query(
    `UPDATE users SET 
      is_banned = TRUE, 
      ban_type = $1, 
      ban_reason = $2, 
      banned_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = $3`,
    [banType, reason || null, userId]
  );
};

const unban = async (userId) => {
  await pool.query(
    `UPDATE users SET 
      is_banned = FALSE, 
      ban_type = NULL, 
      ban_reason = NULL, 
      banned_at = NULL,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1`,
    [userId]
  );
};

const getStats = async () => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE role = 'auteur') as total_authors,
      COUNT(*) FILTER (WHERE role = 'lecteur') as total_readers,
      COUNT(*) FILTER (WHERE is_banned = TRUE) as banned_users
    FROM users
  `);
  return result.rows[0];
};

module.exports = {
  findByEmail,
  findByPseudo,
  findById,
  create,
  updateProfile,
  updatePassword,
  getPassword,
  setResetToken,
  findByResetToken,
  clearResetToken,
  checkEmailExists,
  getBanStatus,
  findAll,
  ban,
  unban,
  getStats,
};
