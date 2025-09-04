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
