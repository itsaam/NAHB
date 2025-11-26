const Page = require("../models/mongodb/Page");
const Story = require("../models/mongodb/Story");
const logger = require("../utils/logger");

/**
 * Créer une nouvelle page (niveau 10/20)
 */
const createPage = async (req, res) => {
  try {
    const { storyId, content, illustration, isEnd, endLabel } = req.body;
    const userId = req.user.id;

    logger.info(
      `Création d'une page pour l'histoire ${storyId} par l'utilisateur ${userId}`
    );

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const story = await Story.findById(storyId);

    if (!story) {
      logger.warn(`Histoire introuvable : ${storyId}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    if (story.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative de création de page non autorisée pour ${storyId} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error:
          "Vous n'êtes pas autorisé à créer des pages pour cette histoire.",
      });
    }

    // Créer la page
    const page = new Page({
      storyId,
      content,
      illustration: illustration || "",
      isEnd: isEnd || false,
      endLabel: endLabel || "",
      choices: [],
    });

    await page.save();

    logger.info(`Page créée avec succès : ${page._id}`);

    return res.status(201).json({
      success: true,
      data: page,
    });
  } catch (err) {
    logger.error(`Erreur lors de la création de la page : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création de la page.",
    });
  }
};

/**
 * Récupérer toutes les pages d'une histoire
 */
const getStoryPages = async (req, res) => {
  try {
    const { storyId } = req.params;

    logger.info(`Récupération des pages de l'histoire ${storyId}`);

    // Vérifier que l'histoire existe
    const story = await Story.findById(storyId);

    if (!story) {
      logger.warn(`Histoire introuvable : ${storyId}`);
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable.",
      });
    }

    // Récupérer toutes les pages
    const pages = await Page.find({ storyId }).select("-__v").lean();

    logger.info(`${pages.length} pages trouvées pour l'histoire ${storyId}`);

    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération des pages : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des pages.",
    });
  }
};

/**
 * Récupérer une page par son ID
 */
const getPageById = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Récupération de la page : ${id}`);

    const page = await Page.findById(id)
      .populate("storyId", "title authorPostgresId status isSuspended")
      .select("-__v")
      .lean();

    if (!page) {
      logger.warn(`Page introuvable : ${id}`);
      return res.status(404).json({
        success: false,
        error: "Page introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (err) {
    logger.error(`Erreur lors de la récupération de la page : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération de la page.",
    });
  }
};

/**
 * Modifier une page (niveau 10/20)
 */
const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    logger.info(`Mise à jour de la page ${id} par l'utilisateur ${userId}`);

    const page = await Page.findById(id).populate("storyId");

    if (!page) {
      logger.warn(`Page introuvable : ${id}`);
      return res.status(404).json({
        success: false,
        error: "Page introuvable.",
      });
    }

    // Vérifier que l'utilisateur est l'auteur de l'histoire
    if (page.storyId.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative de modification non autorisée de la page ${id} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier cette page.",
      });
    }

    // Mettre à jour les champs
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== "choices") {
        page[key] = updates[key];
      }
    });

    await page.save();

    logger.info(`Page mise à jour avec succès : ${id}`);

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (err) {
    logger.error(`Erreur lors de la mise à jour de la page : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la mise à jour de la page.",
    });
  }
};

/**
 * Supprimer une page (niveau 10/20)
 */
const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info(`Suppression de la page ${id} par l'utilisateur ${userId}`);

    const page = await Page.findById(id).populate("storyId");

    if (!page) {
      logger.warn(`Page introuvable : ${id}`);
      return res.status(404).json({
        success: false,
        error: "Page introuvable.",
      });
    }

    // Vérifier que l'utilisateur est l'auteur de l'histoire
    if (page.storyId.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative de suppression non autorisée de la page ${id} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à supprimer cette page.",
      });
    }

    // Vérifier si cette page est la page de départ de l'histoire
    if (
      page.storyId.startPageId &&
      page.storyId.startPageId.toString() === id
    ) {
      logger.warn(`Tentative de suppression de la page de départ : ${id}`);
      return res.status(400).json({
        success: false,
        error:
          "Impossible de supprimer la page de départ. Modifiez d'abord la page de départ de l'histoire.",
      });
    }

    // Supprimer la page
    await Page.findByIdAndDelete(id);

    // Supprimer les choix pointant vers cette page
    await Page.updateMany(
      { "choices.targetPageId": id },
      { $pull: { choices: { targetPageId: id } } }
    );

    logger.info(`Page supprimée avec succès : ${id}`);

    return res.status(200).json({
      success: true,
      data: { message: "Page supprimée avec succès." },
    });
  } catch (err) {
    logger.error(`Erreur lors de la suppression de la page : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression de la page.",
    });
  }
};

/**
 * Ajouter un choix à une page (niveau 10/20)
 */
const addChoice = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { text, targetPageId, order, diceRequirement } = req.body;
    const userId = req.user.id;

    logger.info(
      `Ajout d'un choix à la page ${pageId} par l'utilisateur ${userId}`
    );

    const page = await Page.findById(pageId).populate("storyId");

    if (!page) {
      logger.warn(`Page introuvable : ${pageId}`);
      return res.status(404).json({
        success: false,
        error: "Page introuvable.",
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (page.storyId.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative d'ajout de choix non autorisée sur ${pageId} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier cette page.",
      });
    }

    // Vérifier que la page n'est pas une page finale
    if (page.isEnd) {
      logger.warn(`Tentative d'ajout de choix sur une page finale : ${pageId}`);
      return res.status(400).json({
        success: false,
        error: "Impossible d'ajouter des choix à une page finale.",
      });
    }

    // Vérifier que la page cible existe et appartient à la même histoire
    const targetPage = await Page.findById(targetPageId);
    if (!targetPage) {
      logger.warn(`Page cible introuvable : ${targetPageId}`);
      return res.status(404).json({
        success: false,
        error: "Page cible introuvable.",
      });
    }

    if (targetPage.storyId.toString() !== page.storyId._id.toString()) {
      logger.warn(`Tentative de lier des pages d'histoires différentes`);
      return res.status(400).json({
        success: false,
        error: "La page cible doit appartenir à la même histoire.",
      });
    }

    // Ajouter le choix
    const { diceRequired, diceThreshold, failurePageId } = req.body;

    logger.info(
      `Données dés reçues: diceRequired=${diceRequired}, threshold=${diceThreshold}, failurePageId=${failurePageId}`
    );

    const newChoice = {
      text,
      targetPageId,
      order: order !== undefined ? order : page.choices.length,
      diceRequired: diceRequired === true || diceRequired === "true",
      diceThreshold: diceThreshold ? parseInt(diceThreshold, 10) : 10,
      failurePageId: failurePageId || null,
    };

    logger.info(`Choix créé: ${JSON.stringify(newChoice)}`);

    page.choices.push(newChoice);
    await page.save();

    logger.info(`Choix ajouté avec succès à la page ${pageId}`);

    return res.status(201).json({
      success: true,
      data: page,
    });
  } catch (err) {
    logger.error(`Erreur lors de l'ajout du choix : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'ajout du choix.",
    });
  }
};

/**
 * Supprimer un choix d'une page
 */
const deleteChoice = async (req, res) => {
  try {
    const { pageId, choiceId } = req.params;
    const userId = req.user.id;

    logger.info(
      `Suppression du choix ${choiceId} de la page ${pageId} par ${userId}`
    );

    const page = await Page.findById(pageId).populate("storyId");

    if (!page) {
      logger.warn(`Page introuvable : ${pageId}`);
      return res.status(404).json({
        success: false,
        error: "Page introuvable.",
      });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (page.storyId.authorPostgresId !== userId && req.user.role !== "admin") {
      logger.warn(
        `Tentative de suppression de choix non autorisée sur ${pageId} par ${userId}`
      );
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier cette page.",
      });
    }

    // Supprimer le choix
    page.choices = page.choices.filter(
      (choice) => choice._id.toString() !== choiceId
    );
    await page.save();

    logger.info(`Choix supprimé avec succès de la page ${pageId}`);

    return res.status(200).json({
      success: true,
      data: page,
    });
  } catch (err) {
    logger.error(`Erreur lors de la suppression du choix : ${err.message}`);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression du choix.",
    });
  }
};

module.exports = {
  createPage,
  getStoryPages,
  getPageById,
  updatePage,
  deletePage,
  addChoice,
  deleteChoice,
};
