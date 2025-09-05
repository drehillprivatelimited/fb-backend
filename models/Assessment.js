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
    default: 'likert'
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
    },
    // New field for detailed scale options
    scaleOptions: [{
      value: Number,
      label: String,
      description: String
    }]
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
    required: false,
    default: 1
  }
});

const assessmentSchema = new mongoose.Schema({
  id: {
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
    enum: [
      'Technology',
      'Business & Strategy', 
      'Design & Experience',
      'Healthcare & Life Sciences',
      'Engineering & Manufacturing',
      'Security & Risk',
      'Data & Analytics',
      'Digital Marketing & Content',
      'Product & Innovation',
      'Cloud & Infrastructure',
      'Emerging Technologies',
      'Customer Success & Support',
      'Education & Training',
      'Green & Sustainability',
      'Legal, Compliance & Governance'
    ]
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
    required: false,
    default: ''
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
  // Assessment sections with unified structure - only the 5 required sections
  sections: {
    introduction: {
      title: {
        type: String,
        default: 'Introduction'
      },
      description: {
        type: String,
        default: 'Welcome to your career readiness assessment'
      },
      type: {
        type: String,
        default: 'introduction'
      },
      weight: {
        type: Number,
        default: 0
      },
      orderIndex: {
        type: Number,
        default: 1
      },
      questions: [questionSchema],
      scoringConfig: mongoose.Schema.Types.Mixed
    },
    psychometric: {
      title: {
        type: String,
        default: 'Psychological Fit'
      },
      description: {
        type: String,
        default: 'Assess your personality compatibility with AI/ML careers'
      },
      type: {
        type: String,
        default: 'psychometric'
      },
      weight: {
        type: Number,
        default: 25
      },
      orderIndex: {
        type: Number,
        default: 2
      },
      questions: [questionSchema],
      scoringConfig: mongoose.Schema.Types.Mixed
    },
    technical: {
      title: {
        type: String,
        default: 'Technical Aptitude'
      },
      description: {
        type: String,
        default: 'Evaluate your coding, math, and ML knowledge'
      },
      type: {
        type: String,
        default: 'technical'
      },
      weight: {
        type: Number,
        default: 30
      },
      orderIndex: {
        type: Number,
        default: 3
      },
      questions: [questionSchema],
      scoringConfig: mongoose.Schema.Types.Mixed
    },
    wiscar: {
      title: {
        type: String,
        default: 'FB6 Index Analysis'
      },
      description: {
        type: String,
        default: 'Comprehensive evaluation across 6 key dimensions'
      },
      type: {
        type: String,
        default: 'wiscar'
      },
      weight: {
        type: Number,
        default: 25
      },
      orderIndex: {
        type: Number,
        default: 4
      },
      questions: [questionSchema],
      scoringConfig: mongoose.Schema.Types.Mixed
    },
    results: {
      title: {
        type: String,
        default: 'Your Results'
      },
      description: {
        type: String,
        default: 'Review your assessment results and recommendations'
      },
      type: {
        type: String,
        default: 'results'
      },
      weight: {
        type: Number,
        default: 10
      },
      orderIndex: {
        type: Number,
        default: 5
      },
      questions: [questionSchema],
      scoringConfig: mongoose.Schema.Types.Mixed
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

// Create index for better query performance
assessmentSchema.index({ id: 1 });
assessmentSchema.index({ category: 1, isActive: 1 });
assessmentSchema.index({ featured: 1, isActive: 1 });
assessmentSchema.index({ isActive: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;
