import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true
  },
  sectionId: {
    type: String,
    required: true,
    enum: ['introduction', 'psychometric', 'technical', 'wiscar', 'results']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
});

const sectionProgressSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true,
    enum: ['introduction', 'psychometric', 'technical', 'wiscar', 'results']
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  questionsAnswered: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
});

const sectionScoreSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true,
    enum: ['introduction', 'psychometric', 'technical', 'wiscar', 'results']
  },
  score: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  performance: {
    type: String,
    enum: ['excellent', 'good', 'needsImprovement'],
    required: true
  }
});

const wiscarScoresSchema = new mongoose.Schema({
  will: {
    type: Number,
    required: true
  },
  interest: {
    type: Number,
    required: true
  },
  skill: {
    type: Number,
    required: true
  },
  cognitive: {
    type: Number,
    required: true
  },
  ability: {
    type: Number,
    required: true
  },
  realWorld: {
    type: Number,
    required: true
  },
  overall: {
    type: Number,
    required: true
  }
});

const careerPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  alignmentScore: {
    type: Number,
    required: true
  },
  matchLevel: {
    type: String,
    enum: ['excellent', 'good', 'moderate', 'poor'],
    required: true
  },
  requirements: [String],
  recommendations: [String]
});

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['overall', 'section', 'career', 'learning'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  },
  nextSteps: [String]
});

const assessmentSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  assessmentId: {
    type: String,
    required: true,
    ref: 'Assessment'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  // Section progress tracking - only for the 5 required sections
  sectionProgress: {
    introduction: {
      type: sectionProgressSchema,
      default: () => ({
        sectionId: 'introduction',
        status: 'not-started',
        questionsAnswered: 0,
        totalQuestions: 0
      })
    },
    psychometric: {
      type: sectionProgressSchema,
      default: () => ({
        sectionId: 'psychometric',
        status: 'not-started',
        questionsAnswered: 0,
        totalQuestions: 0
      })
    },
    technical: {
      type: sectionProgressSchema,
      default: () => ({
        sectionId: 'technical',
        status: 'not-started',
        questionsAnswered: 0,
        totalQuestions: 0
      })
    },
    wiscar: {
      type: sectionProgressSchema,
      default: () => ({
        sectionId: 'wiscar',
        status: 'not-started',
        questionsAnswered: 0,
        totalQuestions: 0
      })
    },
    results: {
      type: sectionProgressSchema,
      default: () => ({
        sectionId: 'results',
        status: 'not-started',
        questionsAnswered: 0,
        totalQuestions: 0
      })
    }
  },
  answers: [answerSchema],
  results: {
    overallScore: {
      type: Number,
      required: false
    },
    recommendation: {
      type: String,
      enum: ['yes', 'maybe', 'no'],
      required: false
    },
    confidence: {
      type: Number,
      required: false
    },
    reason: {
      type: String,
      required: false
    },
    sectionScores: [sectionScoreSchema],
    wiscarScores: wiscarScoresSchema,
    careerPaths: [careerPathSchema],
    recommendations: [recommendationSchema],
    strengths: [String],
    improvements: [String],
    nextSteps: [String]
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    deviceType: String
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
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

// Create indexes for better query performance
assessmentSessionSchema.index({ sessionId: 1 });
assessmentSessionSchema.index({ assessmentId: 1, status: 1 });
assessmentSessionSchema.index({ userId: 1, assessmentId: 1 });
assessmentSessionSchema.index({ status: 1, createdAt: 1 });

const AssessmentSession = mongoose.model('AssessmentSession', assessmentSessionSchema);

export default AssessmentSession;
