import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    default: 'India',
    trim: true
  },
  ageRange: {
    type: String,
    required: true,
    enum: ['11-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
  },
  // Assessment tracking fields
  currentAssessment: {
    assessmentId: String,
    assessmentTitle: String,
    startedAt: Date,
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed', 'abandoned'],
      default: 'started'
    },
    currentSection: String,
    currentQuestion: Number,
    totalQuestions: Number,
    completedQuestions: Number
  },
  assessmentHistory: [{
    assessmentId: String,
    assessmentTitle: String,
    startedAt: Date,
    completedAt: Date,
    duration: Number, // in minutes
    status: {
      type: String,
      enum: ['completed', 'abandoned']
    },
    overallScore: Number,
    categoryScores: {
      psychological: Number,
      technical: Number,
      wiscar: Number,
      motivation: Number,
      preferences: Number
    },
    recommendation: {
      type: String,
      enum: ['YES', 'MAYBE', 'NO']
    },
    recommendationReason: String,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      submittedAt: Date
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for better query performance
userSchema.index({ createdAt: -1 });
userSchema.index({ ageRange: 1 });

const User = mongoose.model('User', userSchema);

export default User;
