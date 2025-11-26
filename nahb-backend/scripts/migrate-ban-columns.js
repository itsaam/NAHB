/**
 * Script de migration pour ajouter les colonnes de ban
 * Exécuter avec: node scripts/migrate-ban-columns.js
 */
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PG_HOST || "localhost",
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || "nahb",
  user: process.env.PG_USER || "postgres",
  password: process.env.PG_PASSWORD || "password",
});

const migrate = async () => {
  try {
    console.log("🔄 Début de la migration...");

    // Ajouter les nouvelles colonnes si elles n'existent pas
    await pool.query(`
      DO $$ 
      BEGIN
        -- Ajouter ban_type si n'existe pas
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'users' AND column_name = 'ban_type') THEN
          ALTER TABLE users ADD COLUMN ban_type VARCHAR(20) DEFAULT NULL 
            CHECK (ban_type IN ('full', 'author', 'comment'));
          RAISE NOTICE 'Colonne ban_type ajoutée';
        END IF;

        -- Ajouter ban_reason si n'existe pas
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'users' AND column_name = 'ban_reason') THEN
          ALTER TABLE users ADD COLUMN ban_reason TEXT;
          RAISE NOTICE 'Colonne ban_reason ajoutée';
        END IF;

        -- Ajouter banned_at si n'existe pas
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'users' AND column_name = 'banned_at') THEN
          ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
          RAISE NOTICE 'Colonne banned_at ajoutée';
        END IF;
      END $$;
    `);

    // Mettre à jour les utilisateurs déjà bannis avec ban_type = 'full'
    const result = await pool.query(`
      UPDATE users 
      SET ban_type = 'full', banned_at = CURRENT_TIMESTAMP 
      WHERE is_banned = TRUE AND ban_type IS NULL
      RETURNING id, pseudo
    `);

    if (result.rows.length > 0) {
      console.log(`✅ ${result.rows.length} utilisateurs bannis mis à jour avec ban_type = 'full'`);
      result.rows.forEach(user => console.log(`   - ${user.pseudo} (ID: ${user.id})`));
    }

    console.log("✅ Migration terminée avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de la migration :", err.message);
    process.exit(1);
  }
};

migrate();
