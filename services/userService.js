import User from '../models/User.js';

class UserService {
  // Create or update user
  async createOrUpdateUser(userData) {
    try {
      const { country, ageRange } = userData;

      // Always create a new user since email is no longer used as identifier
      const user = new User({
        country,
        ageRange
      });
      await user.save();
      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
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

  // Add assessment session to user
  async addAssessmentSession(userId, sessionId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      user.assessmentSessions.push(sessionId);
      user.totalAssessments += 1;
      user.lastAssessmentDate = new Date();
      await user.save();
      
      return user;
    } catch (error) {
      console.error('Error adding assessment session to user:', error);
      throw error;
    }
  }

  // Mark assessment as completed for user
  async markAssessmentCompleted(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      user.completedAssessments += 1;
      await user.save();
      
      return user;
    } catch (error) {
      console.error('Error marking assessment as completed:', error);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics(userId) {
    try {
      const user = await User.findById(userId).populate('assessmentSessions');
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        totalAssessments: user.totalAssessments,
        completedAssessments: user.completedAssessments,
        completionRate: user.totalAssessments > 0 ? (user.completedAssessments / user.totalAssessments) * 100 : 0,
        lastAssessmentDate: user.lastAssessmentDate,
        assessmentSessions: user.assessmentSessions
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
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
