import mongoose from 'mongoose';

const questionOptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  score: {
    type: Number,
    default: 0
  }
});

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'slider', 'boolean', 'scenario', 'text', 'likert'],
    default: 'slider'
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String
  },
  options: [questionOptionSchema],
  scale: {
    min: Number,
    max: Number,
    labels: {
      min: String,
      max: String
    }
  },
  required: {
    type: Boolean,
    default: true
  },
  weight: {
    type: Number,
    default: 1
  },
  orderIndex: {
    type: Number,
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    enum: ['introduction', 'psychometric', 'technical', 'wiscar', 'results']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['introduction', 'psychometric', 'technical', 'wiscar', 'results']
  },
  weight: {
    type: Number,
    required: true,
    default: 25
  },
  orderIndex: {
    type: Number,
    required: true
  },
  questions: [questionSchema],
  scoringConfig: {
    algorithm: {
      type: String,
      enum: ['sum', 'average', 'weighted', 'custom'],
      default: 'average'
    },
    thresholds: {
      excellent: {
        type: Number,
        default: 80
      },
      good: {
        type: Number,
        default: 60
      },
      needsImprovement: {
        type: Number,
        default: 40
      }
    },
    customScoring: {
      type: mongoose.Schema.Types.Mixed
    }
  }
});

const unifiedAssessmentSchema = new mongoose.Schema({
  assessmentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Cloud', 'Data', 'Technology', 'Programming', 'Management', 'Business', 'Medical', 'Platform']
  },
  duration: {
    type: String,
    required: true,
    default: '10-15 mins'
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  metadata: {
    icon: {
      type: String,
      default: 'code'
    },
    gradient: {
      type: String,
      default: 'from-blue-500 to-blue-700'
    },
    userCount: {
      type: String,
      default: '1K+'
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  whatIsDescription: {
    type: String,
    required: true
  },
  typicalCareers: [{
    title: String,
    description: String
  }],
  whoShouldConsider: [String],
  idealTraits: [String],
  assessmentOverview: {
    modules: [String],
    resultsInclude: [String]
  },
  // All sections consolidated into a single sections array
  sections: [sectionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
unifiedAssessmentSchema.index({ assessmentId: 1 });
unifiedAssessmentSchema.index({ category: 1, isActive: 1 });
unifiedAssessmentSchema.index({ featured: 1, isActive: 1 });
unifiedAssessmentSchema.index({ isActive: 1 });

// Ensure sections are ordered correctly
unifiedAssessmentSchema.index({ 'sections.orderIndex': 1 });

const UnifiedAssessment = mongoose.model('UnifiedAssessment', unifiedAssessmentSchema);

export default UnifiedAssessment;
