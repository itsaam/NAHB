const mongoose = require("mongoose");

// Schema pour les choix (imbriqués dans pages)
const choiceSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    targetPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    // Pour niveau 18/20 (système de dés)
    diceRequirement: {
      type: Number,
      min: 1,
      max: 20,
    },
  },
  { _id: true }
);

// Schema pour les pages (MongoDB)
const pageSchema = new mongoose.Schema(
  {
    // Lien vers story (MongoDB)
    storyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
      required: true,
      index: true,
    },

    // Contenu lourd
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },

    illustration: {
      type: String,
      trim: true,
    },

    // Page finale
    isEnd: {
      type: Boolean,
      default: false,
      index: true,
    },

    endLabel: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // Choix imbriqués (pas de table séparée !)
    choices: [choiceSchema],

    // Stats
    stats: {
      timesReached: {
        type: Number,
        default: 0,
        min: 0,
      },
      timesCompleted: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index
pageSchema.index({ storyId: 1, isEnd: 1 });

// Méthode pour valider qu'une page finale n'a pas de choix
pageSchema.pre("save", function () {
  if (this.isEnd && this.choices && this.choices.length > 0) {
    throw new Error("Une page finale ne peut pas avoir de choix");
  }
});

const Page = mongoose.model("Page", pageSchema);

module.exports = Page;
