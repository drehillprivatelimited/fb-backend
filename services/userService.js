import User from '../models/User.js';

class UserService {
  // Create or update user
  async createOrUpdateUser(userData) {
    try {
      const { gender, ageRange } = userData;

      // Always create a new user since email is no longer used as identifier
      const user = new User({
        gender,
        ageRange
      });
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Start an assessment for a user
  async startAssessment(userId, assessmentData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.currentAssessment = {
        assessmentId: assessmentData.assessmentId,
        assessmentTitle: assessmentData.assessmentTitle,
        startedAt: new Date(),
        isCompleted: false
      };

      await user.save();
      return user;
    } catch (error) {
      console.error('Error starting assessment:', error);
      throw error;
    }
  }

  // Complete an assessment and save feedback
  async completeAssessment(userId, assessmentId, feedback) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.currentAssessment && user.currentAssessment.assessmentId === assessmentId) {
        // Mark assessment as completed and save feedback
        user.currentAssessment.isCompleted = true;
        user.currentAssessment.feedback = {
          rating: feedback.rating,
          comments: feedback.comments,
          submittedAt: new Date()
        };

        await user.save();
      }

      return user;
    } catch (error) {
      console.error('Error completing assessment:', error);
      throw error;
    }
    }

  // Get user by email (deprecated)
  async getUserByEmail() {
    throw new Error('Lookup by email is no longer supported');
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await User.findById(id);
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }







  // Get all users (for admin purposes)
  async getAllUsers(limit = 50, skip = 0) {
    try {
      const users = await User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('-__v');
      
      const total = await User.countDocuments();
      
      return {
        users,
        total,
        limit,
        skip
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Get users by age range
  async getUsersByAgeRange(ageRange) {
    try {
      const users = await User.find({ ageRange }).sort({ createdAt: -1 });
      return users;
    } catch (error) {
      console.error('Error getting users by age range:', error);
      throw error;
    }
  }
}

export default new UserService();
