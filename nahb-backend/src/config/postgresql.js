const { Pool } = require("pg");
const logger = require("../utils/logger");

// Configuration du pool PostgreSQL
const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || "nahb",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "password",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on("connect", () => {
  logger.info("Nouvelle connexion PostgreSQL établie");
});

pool.on("error", (err) => {
  logger.error(`Erreur PostgreSQL : ${err.message}`);
  process.exit(-1);
});

// Initialisation des tables
const initTables = async () => {
  try {
    logger.info("Initialisation des tables PostgreSQL...");

    // Table users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        pseudo VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'lecteur' CHECK (role IN ('lecteur', 'auteur', 'admin')),
        avatar TEXT,
        is_banned BOOLEAN DEFAULT FALSE,
        ban_type VARCHAR(20) DEFAULT NULL CHECK (ban_type IN ('full', 'author', 'comment')),
        ban_reason TEXT,
        banned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_pseudo ON users(pseudo);
    `);

    // Table game_sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        story_mongo_id VARCHAR(24) NOT NULL,
        current_page_mongo_id VARCHAR(24),
        end_page_mongo_id VARCHAR(24),
        is_completed BOOLEAN DEFAULT FALSE,
        is_preview BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON game_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_story ON game_sessions(story_mongo_id);
    `);

    // Table session_paths
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_paths (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        page_mongo_id VARCHAR(24) NOT NULL,
        choice_mongo_id VARCHAR(24),
        step_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_paths_session ON session_paths(session_id);
    `);

    // Table reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        story_mongo_id VARCHAR(24) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, story_mongo_id)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_story ON reviews(story_mongo_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    `);

    // Table reports
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        story_mongo_id VARCHAR(24) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_story ON reports(story_mongo_id);
    `);

    // Table unlocked_endings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS unlocked_endings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        story_mongo_id VARCHAR(24) NOT NULL,
        page_mongo_id VARCHAR(24) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, story_mongo_id, page_mongo_id)
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_unlocked_user ON unlocked_endings(user_id);
      CREATE INDEX IF NOT EXISTS idx_unlocked_story ON unlocked_endings(story_mongo_id);
    `);

    logger.info("✅ Tables PostgreSQL initialisées avec succès");
  } catch (err) {
    logger.error(`Erreur lors de l'initialisation des tables : ${err.message}`);
    throw err;
  }
};

module.exports = { pool, initTables };
