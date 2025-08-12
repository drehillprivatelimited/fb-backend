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

const assessmentSectionSchema = new mongoose.Schema({
  assessmentId: {
    type: String,
    required: true,
    ref: 'Assessment'
  },
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
  },
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

// Create compound index for better query performance
assessmentSectionSchema.index({ assessmentId: 1, orderIndex: 1 });
assessmentSectionSchema.index({ assessmentId: 1, id: 1 });

// Ensure only one section per type per assessment
assessmentSectionSchema.index({ assessmentId: 1, type: 1 }, { unique: true });

const AssessmentSection = mongoose.model('AssessmentSection', assessmentSectionSchema);

export default AssessmentSection;
