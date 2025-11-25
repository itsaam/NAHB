const Story = require("../models/mongodb/Story");
const Page = require("../models/mongodb/Page");
const logger = require("../utils/logger");

/**
 * Fonction utilitaire pour échapper les caractères spéciaux dans une chaîne,
 * afin de créer une expression régulière sécurisée.
 */
function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Créer une nouvelle histoire (niveau 10/20)
 */
const createStory = async (req, res) => {
  try {
    const { title, description, tags, theme, status, coverImage } = req.body;
    const authorPostgresId = req.user.id;

    logger.info(
      `Création d'une histoire par l'utilisateur ${authorPostgresId}: ${title}`
    );

    // Créer l'histoire dans MongoDB
    const story = new Story({
      authorPostgresId,
      title,
      description: description || "",
      tags: tags || [],
      theme: theme || "",
      status: status || "brouillon",
      coverImage: coverImage || "",
    });

    await story.save();

    logger.info(`Histoire créée avec succès : ${story._id}`);

    return res.status(201).json({
      success: true,
      data: story,
    });
  } catch (err) {
    logger.error(`Erreur lors de la création de l'histoire : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création de l'histoire.",
    });
  }
};

/**
 * Lister les histoires publiées (niveau 10/20)
 * Avec recherche et filtres (niveau 13/20)
 */
const getPublishedStories = async (req, res) => {
  try {
    let {
      search,
      theme,
      tags,
      sortBy = "createdAt",
      order = "desc",
      genre,
    } = req.query;

    // Normalisation et nettoyage des entrées
    if (typeof search === "string") search = search.trim();
    if (typeof theme === "string") theme = theme.trim();
    if (typeof genre === "string") genre = genre.trim();

    // Construire le filtre
    const filter = {
      status: "publié",
      isSuspended: false,
    };

    // Recherche textuelle (sur le titre uniquement)
    if (search) {
      const s = String(search).trim();
      if (s.length) {
        filter.title = { $regex: escapeRegExp(s), $options: "i" };
      }
    }

    // Filtre par thème (accepte 'theme' ou 'genre', insensible à la casse, mode contains)
    const themeQuery = (theme || genre || "").toString().trim();
    if (themeQuery) {
      filter.theme = { $regex: escapeRegExp(themeQuery), $options: "i" };
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
    }

    // Tri
    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const stories = await Story.find(filter)
      .sort(sortOptions)
      .select("-__v")
      .lean();

    logger.info(`${stories.length} histoires publiées trouvées`);

    return res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération des histoires : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des histoires.",
    });
  }
};

/**
 * Récupérer une histoire par son ID
 */
const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Récupération de l'histoire : ${id}`);

    const story = await Story.findById(id).select("-__v").lean();

    if (!story) {
      logger.warn(`Histoire introuvable : ${id}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Vérifier si l'histoire est accessible
    if (story.isSuspended && (!req.user || req.user.role !== "admin")) {
      logger.warn(`Tentative d'accès à une histoire suspendue : ${id}`);
      return res.status(403).json({
        success: false,
        error: "Cette histoire a été suspendue.",
      });
    }

    // Si brouillon, seul l'auteur ou admin peut y accéder
    if (story.status === "brouillon") {
      if (
        !req.user ||
        (req.user.id !== story.authorPostgresId && req.user.role !== "admin")
      ) {
        logger.warn(`Tentative d'accès non autorisée à un brouillon : ${id}`);
        return res.status(403).json({
          success: false,
          error: "Vous n'avez pas accès à cette histoire.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: story,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération de l'histoire : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération de l'histoire.",
    });
  }
};

/**
 * Récupérer les histoires de l'auteur connecté
 */
const getMyStories = async (req, res) => {
  try {
    const authorPostgresId = req.user.id;

    logger.info(
      `Récupération des histoires de l'utilisateur ${authorPostgresId}`
    );

    const stories = await Story.find({ authorPostgresId })
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    logger.info(
      `${stories.length} histoires trouvées pour l'utilisateur ${authorPostgresId}`
    );

    return res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la récupération des histoires : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des histoires.",
    });
  }
};

/**
 * Modifier une histoire (niveau 10/20)
 */
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    logger.info(`Mise à jour de l'histoire ${id} par l'utilisateur ${userId}`);

    const story = await Story.findById(id);

    if (!story) {
      logger.warn(`Histoire introuvable : ${id}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Vérifier que l'utilisateur est l'auteur (ou admin)
    if (story.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative de modification non autorisée de l'histoire ${id} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier cette histoire.",
      });
    }

    // Si on définit une startPageId, vérifier qu'elle appartient à cette histoire
    if (updates.startPageId) {
      const page = await Page.findById(updates.startPageId);
      if (!page || page.storyId.toString() !== id) {
        logger.warn(`Page de départ invalide : ${updates.startPageId}`);
        return res.status(400).json({
          success: false,
          error: "La page de départ doit appartenir à cette histoire.",
        });
      }
    }

    // Mettre à jour les champs
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        story[key] = updates[key];
      }
    });

    await story.save();

    logger.info(`Histoire mise à jour avec succès : ${id}`);

    return res.status(200).json({
      success: true,
      data: story,
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la mise à jour de l'histoire : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la mise à jour de l'histoire.",
    });
  }
};

/**
 * Supprimer une histoire (niveau 10/20)
 */
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info(`Suppression de l'histoire ${id} par l'utilisateur ${userId}`);

    const story = await Story.findById(id);

    if (!story) {
      logger.warn(`Histoire introuvable : ${id}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Vérifier que l'utilisateur est l'auteur (ou admin)
    if (story.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative de suppression non autorisée de l'histoire ${id} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer cette histoire.",
      });
    }

    // Supprimer toutes les pages associées
    await Page.deleteMany({ storyId: id });

    // Supprimer l'histoire
    await Story.findByIdAndDelete(id);

    logger.info(`Histoire et pages associées supprimées avec succès : ${id}`);

    return res.status(200).json({
      success: true,
      data: { message: "Histoire supprimée avec succès." },
    });
  } catch (err) {
    logger.error(
      `Erreur lors de la suppression de l'histoire : ${err.message}`
    );
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression de l'histoire.",
    });
  }
};

module.exports = {
  createStory,
  getPublishedStories,
  getStoryById,
  getMyStories,
  updateStory,
  deleteStory,
};
