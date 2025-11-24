const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Configuration MongoDB
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/nahb';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('✅ MongoDB connecté avec succès');

    // Gestion des événements MongoDB
    mongoose.connection.on('error', (err) => {
      logger.error(`Erreur MongoDB : ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB déconnecté');
    });

    // Fermeture propre lors de l'arrêt
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB fermé proprement');
      process.exit(0);
    });

  } catch (err) {
    logger.error(`Erreur de connexion MongoDB : ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectMongoDB;
