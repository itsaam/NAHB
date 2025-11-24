const mongoose = require('mongoose');

// Schema pour les histoires (MongoDB)
const storySchema = new mongoose.Schema({
  // Lien vers PostgreSQL
  authorPostgresId: {
    type: Number,
    required: true,
    index: true
  },

  // Metadata
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },

  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },

  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  theme: {
    type: String,
    trim: true,
    maxlength: 50
  },

  status: {
    type: String,
    enum: ['brouillon', 'publié'],
    default: 'brouillon',
    index: true
  },

  // Lien vers la page de départ (MongoDB)
  startPageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Page'
  },

  coverImage: {
    type: String,
    trim: true
  },

  // Stats agrégées
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  stats: {
    totalPlays: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCompletions: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAbandonments: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Admin
  isSuspended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour recherche et filtres
storySchema.index({ title: 'text', description: 'text' });
storySchema.index({ theme: 1 });
storySchema.index({ status: 1, isSuspended: 1 });
storySchema.index({ 'stats.totalPlays': -1 });

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
