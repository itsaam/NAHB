const Joi = require("joi");
const logger = require("../utils/logger");

/**
 * Middleware de validation avec Joi
 * @param {Joi.Schema} schema - Schema Joi à valider
 * @param {string} source - Source des données ('body', 'query', 'params')
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Retourne toutes les erreurs
        stripUnknown: true, // Enlève les champs non définis
      });

      if (error) {
        const errors = error.details.map((detail) => detail.message);
        logger.warn(`Validation échouée : ${errors.join(", ")}`);

        return res.status(400).json({
          success: false,
          error: "Données invalides.",
          details: errors,
        });
      }

      // Remplacer les données par les données validées
      req[source] = value;
      next();
    } catch (err) {
      logger.error(`Erreur middleware validation : ${err.message}`);
      return res.status(500).json({
        success: false,
        error: "Erreur serveur lors de la validation.",
      });
    }
  };
};

// ==================== SCHEMAS DE VALIDATION ====================

// Auth
const registerSchema = Joi.object({
  pseudo: Joi.string().min(3).max(50).required().messages({
    "string.min": "Le pseudo doit contenir au moins 3 caractères",
    "string.max": "Le pseudo ne peut pas dépasser 50 caractères",
    "any.required": "Le pseudo est obligatoire",
  }),

  email: Joi.string().email().max(255).required().messages({
    "string.email": "L'email doit être valide",
    "any.required": "L'email est obligatoire",
  }),

  password: Joi.string().min(8).max(100).required().messages({
    "string.min": "Le mot de passe doit contenir au moins 8 caractères",
    "any.required": "Le mot de passe est obligatoire",
  }),

  role: Joi.string().valid("lecteur", "auteur").default("lecteur").messages({
    "any.only": 'Le rôle doit être "lecteur" ou "auteur"',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "L'email doit être valide",
    "any.required": "L'email est obligatoire",
  }),

  password: Joi.string().required().messages({
    "any.required": "Le mot de passe est obligatoire",
  }),
});

// Stories
const createStorySchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    "string.min": "Le titre doit contenir au moins 3 caractères",
    "string.max": "Le titre ne peut pas dépasser 255 caractères",
    "any.required": "Le titre est obligatoire",
  }),

  description: Joi.string().max(2000).allow("", null).messages({
    "string.max": "La description ne peut pas dépasser 2000 caractères",
  }),

  tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
    "array.max": "Vous ne pouvez pas ajouter plus de 10 tags",
  }),

  theme: Joi.string().max(50).allow("", null),

  status: Joi.string()
    .valid("brouillon", "publié")
    .default("brouillon")
    .messages({
      "any.only": 'Le statut doit être "brouillon" ou "publié"',
    }),

  coverImage: Joi.string().uri().allow("", null).messages({
    "string.uri": "L'image de couverture doit être une URL valide",
  }),
});

const updateStorySchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().max(2000).allow("", null),
  tags: Joi.array().items(Joi.string().max(50)).max(10),
  theme: Joi.string().max(50).allow("", null),
  status: Joi.string().valid("brouillon", "publié"),
  startPageId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base":
        "L'ID de la page de départ doit être un ObjectId MongoDB valide",
    }),
  coverImage: Joi.string().uri().allow("", null),
})
  .min(1)
  .messages({
    "object.min": "Au moins un champ doit être fourni pour la mise à jour",
  });

// Pages
const createPageSchema = Joi.object({
  storyId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "L'ID de l'histoire doit être un ObjectId MongoDB valide",
      "any.required": "L'ID de l'histoire est obligatoire",
    }),

  content: Joi.string().min(10).max(10000).required().messages({
    "string.min": "Le contenu doit contenir au moins 10 caractères",
    "string.max": "Le contenu ne peut pas dépasser 10000 caractères",
    "any.required": "Le contenu est obligatoire",
  }),

  illustration: Joi.string().uri().allow("", null),

  isEnd: Joi.boolean().default(false),

  endLabel: Joi.string()
    .max(100)
    .allow("", null)
    .when("isEnd", {
      is: true,
      then: Joi.required().messages({
        "any.required": "Le label de fin est obligatoire pour une page finale",
      }),
    }),
});

const updatePageSchema = Joi.object({
  content: Joi.string().min(10).max(10000),
  illustration: Joi.string().uri().allow("", null),
  isEnd: Joi.boolean(),
  endLabel: Joi.string().max(100).allow("", null),
}).min(1);

// Choices
const addChoiceSchema = Joi.object({
  text: Joi.string().min(3).max(255).required().messages({
    "string.min": "Le texte du choix doit contenir au moins 3 caractères",
    "string.max": "Le texte du choix ne peut pas dépasser 255 caractères",
    "any.required": "Le texte du choix est obligatoire",
  }),

  targetPageId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "L'ID de la page cible doit être un ObjectId MongoDB valide",
      "any.required": "L'ID de la page cible est obligatoire",
    }),

  order: Joi.number().integer().min(0).default(0),

  // Système de dés (niveau 18/20)
  diceRequired: Joi.boolean().default(false),
  diceThreshold: Joi.number().integer().min(1).max(20).default(10),
  failurePageId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, "")
    .messages({
      "string.pattern.base":
        "L'ID de la page d'échec doit être un ObjectId MongoDB valide",
    }),
});

// Reviews
const createReviewSchema = Joi.object({
  storyMongoId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "L'ID de l'histoire doit être un ObjectId MongoDB valide",
      "any.required": "L'ID de l'histoire est obligatoire",
    }),

  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "La note doit être comprise entre 1 et 5",
    "number.max": "La note doit être comprise entre 1 et 5",
    "any.required": "La note est obligatoire",
  }),

  comment: Joi.string().max(1000).allow("", null).messages({
    "string.max": "Le commentaire ne peut pas dépasser 1000 caractères",
  }),
});

// Reports
const createReportSchema = Joi.object({
  storyMongoId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base":
        "L'ID de l'histoire doit être un ObjectId MongoDB valide",
      "any.required": "L'ID de l'histoire est obligatoire",
    }),

  reason: Joi.string().min(10).max(500).required().messages({
    "string.min": "Le motif doit contenir au moins 10 caractères",
    "string.max": "Le motif ne peut pas dépasser 500 caractères",
    "any.required": "Le motif du signalement est obligatoire",
  }),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createStorySchema,
  updateStorySchema,
  createPageSchema,
  updatePageSchema,
  addChoiceSchema,
  createReviewSchema,
  createReportSchema,
};
