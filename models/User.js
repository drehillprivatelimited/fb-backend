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
    enum: ['11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Track assessment sessions
  assessmentSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssessmentSession'
  }],
  // Analytics data
  totalAssessments: {
    type: Number,
    default: 0
  },
  completedAssessments: {
    type: Number,
    default: 0
  },
  lastAssessmentDate: {
    type: Date,
    default: null
  }
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
