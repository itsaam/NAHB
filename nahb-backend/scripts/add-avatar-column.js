require("dotenv").config();
const { pool } = require("../src/config/postgresql");

async function addAvatarColumn() {
  try {
    console.log("Ajout de la colonne avatar à la table users...");

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS avatar TEXT;
    `);

    console.log("✅ Colonne avatar ajoutée avec succès !");

    // Vérifier que la colonne existe
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatar';
    `);

    if (result.rows.length > 0) {
      console.log("✅ Vérification : colonne avatar existe bien");
      console.log(result.rows[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la colonne :", error);
    process.exit(1);
  }
}

addAvatarColumn();
