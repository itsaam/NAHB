const { pool } = require("../config/postgresql");
const Story = require("../models/mongodb/Story");
const Page = require("../models/mongodb/Page");
const logger = require("../utils/logger");

/**
 * Récupérer les fins débloquées par l'utilisateur pour une histoire
 */
const getUnlockedEndings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storyId } = req.params;

    // Vérifier que l'histoire existe
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable",
      });
    }

    // Récupérer les fins débloquées depuis PostgreSQL
    const result = await pool.query(
      `SELECT ue.end_page_mongo_id, ue.unlocked_at 
       FROM unlocked_endings ue
       WHERE ue.user_id = $1 AND ue.story_mongo_id = $2
       ORDER BY ue.unlocked_at DESC`,
      [userId, storyId]
    );

    // Récupérer les détails des pages finales depuis MongoDB
    const endPageIds = result.rows.map((row) => row.end_page_mongo_id);
    const endPages = await Page.find({
      _id: { $in: endPageIds },
      storyId: storyId,
      isEnd: true,
    }).select("_id content endLabel illustration");

    // Construire la réponse avec les dates de déblocage
    const unlockedEndings = endPages.map((page) => {
      const unlockInfo = result.rows.find(
        (row) => row.end_page_mongo_id === page._id.toString()
      );
      return {
        _id: page._id,
        endLabel: page.endLabel,
        content: page.content,
        illustration: page.illustration,
        unlockedAt: unlockInfo?.unlocked_at,
      };
    });

    logger.info(
      `Fins débloquées récupérées pour l'utilisateur ${userId} - Histoire: ${storyId}`
    );

    res.status(200).json({
      success: true,
      data: {
        storyId: story._id,
        storyTitle: story.title,
        unlockedEndings,
        totalUnlocked: unlockedEndings.length,
      },
    });
  } catch (error) {
    logger.error(`Erreur getUnlockedEndings : ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des fins débloquées",
    });
  }
};

/**
 * Récupérer toutes les fins possibles d'une histoire (pour voir ce qui reste à débloquer)
 */
const getAllStoryEndings = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { storyId } = req.params;

    // Vérifier que l'histoire existe et est publiée
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: "Histoire introuvable",
      });
    }

    if (
      story.status !== "publié" &&
      (!req.user || story.authorPostgresId !== userId)
    ) {
      return res.status(403).json({
        success: false,
        error: "Histoire non accessible",
      });
    }

    // Récupérer toutes les pages finales de l'histoire
    const allEndings = await Page.find({
      storyId: storyId,
      isEnd: true,
    }).select("_id endLabel content illustration");

    // Si l'utilisateur est connecté, marquer celles qu'il a débloquées
    let unlockedEndingIds = [];
    if (userId) {
      const result = await pool.query(
        `SELECT end_page_mongo_id FROM unlocked_endings 
         WHERE user_id = $1 AND story_mongo_id = $2`,
        [userId, storyId]
      );
      unlockedEndingIds = result.rows.map((row) => row.end_page_mongo_id);
    }

    // Construire la réponse
    const endings = allEndings.map((ending) => ({
      _id: ending._id,
      endLabel: ending.endLabel,
      content: ending.content,
      illustration: ending.illustration,
      isUnlocked: unlockedEndingIds.includes(ending._id.toString()),
    }));

    logger.info(`Liste des fins récupérée pour l'histoire ${storyId}`);

    res.status(200).json({
      success: true,
      data: {
        storyId: story._id,
        storyTitle: story.title,
        endings,
        totalEndings: endings.length,
        unlockedCount: unlockedEndingIds.length,
      },
    });
  } catch (error) {
    logger.error(`Erreur getAllStoryEndings : ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des fins",
    });
  }
};

module.exports = {
  getUnlockedEndings,
  getAllStoryEndings,
};
