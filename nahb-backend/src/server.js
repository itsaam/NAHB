require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool, initTables } = require("./config/postgresql");
const connectMongoDB = require("./config/mongodb");
const logger = require("./utils/logger");
const { swaggerUi, specs } = require("./config/swagger");

// Import des routes
const authRoutes = require("./routes/authRoutes");
const storyRoutes = require("./routes/storyRoutes");
const pageRoutes = require("./routes/pageRoutes");
const gameRoutes = require("./routes/gameRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// ==================== MIDDLEWARES ====================

// CORS
app.use(
  cors({
    origin: [process.env.CORS_ORIGIN || "http://localhost:3000", "null"],
    credentials: true,
  })
);

// Parser JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logger des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// ==================== ROUTES ====================

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Route racine - info API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "NAHB API",
      message: "Bienvenue sur l'API NAHB - Not A Horror Book",
      version: "1.0.0",
      documentation: "/api-docs",
      health: "/api/health",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: "API NAHB opérationnelle",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Routes principales
app.use("/api/auth", authRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// Servir le frontend en production
if (process.env.NODE_ENV === "production") {
  const path = require("path");
  const frontendPath = path.join(__dirname, "../../nahb-frontend/dist");

  app.use(express.static(frontendPath));

  // Catch-all route pour le frontend SPA
  app.use((req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  // Route 404 en dev
  app.use((req, res) => {
    logger.warn(`Route introuvable : ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      error: "Route introuvable.",
    });
  });
}

// ==================== GESTION DES ERREURS ====================

app.use((err, req, res, next) => {
  logger.error(`Erreur serveur : ${err.message}`);
  logger.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Erreur de validation des données.",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "ID MongoDB invalide.",
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      error: "Une entrée avec ces données existe déjà.",
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      error: "Référence invalide à une ressource.",
    });
  }

  return res.status(500).json({
    success: false,
    error: "Erreur serveur interne.",
  });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

const startServer = async () => {
  try {
    logger.info("=== Démarrage du serveur NAHB ===");

    logger.info("Connexion à PostgreSQL...");
    const pgClient = await pool.connect();
    pgClient.release();
    logger.info("✅ PostgreSQL connecté");

    await initTables();

    logger.info("Connexion à MongoDB...");
    await connectMongoDB();

    app.listen(PORT, () => {
      logger.info(`✅ Serveur démarré sur le port ${PORT}`);
      logger.info(
        `🌍 Environnement : ${process.env.NODE_ENV || "development"}`
      );
      logger.info(`🔗 API disponible sur : http://localhost:${PORT}/api`);
      logger.info(`🏥 Health check : http://localhost:${PORT}/api/health`);
      logger.info("=================================");
    });
  } catch (err) {
    logger.error(
      `❌ Erreur fatale lors du démarrage du serveur : ${err.message}`
    );
    logger.error(err.stack);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  logger.info("Arrêt du serveur en cours...");

  try {
    await pool.end();
    logger.info("PostgreSQL fermé proprement");

    process.exit(0);
  } catch (err) {
    logger.error(`Erreur lors de l'arrêt : ${err.message}`);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  logger.info("Signal SIGTERM reçu, arrêt du serveur...");

  try {
    await pool.end();
    process.exit(0);
  } catch (err) {
    logger.error(`Erreur lors de l'arrêt : ${err.message}`);
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesse rejetée non gérée :");
  logger.error(reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Exception non capturée :");
  logger.error(err);
  process.exit(1);
});

startServer();
