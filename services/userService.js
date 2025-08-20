import User from '../models/User.js';

class UserService {
  // Create or update user
  async createOrUpdateUser(userData) {
    try {
      const { name, email, ageRange } = userData;
      
      // Check if user already exists
      let user = await User.findOne({ email });
      
      if (user) {
        // Update existing user
        user.name = name;
        user.ageRange = ageRange;
        user.updatedAt = new Date();
        await user.save();
        return user;
      } else {
        // Create new user
        user = new User({
          name,
          email,
          ageRange
        });
        await user.save();
        return user;
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
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
      console.error('Error marking assessment completed:', error);
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
        ageRange: user.ageRange,
        joinedDate: user.createdAt
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
        hasMore: total > skip + limit
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
