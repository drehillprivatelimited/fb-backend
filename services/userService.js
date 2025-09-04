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
        status: 'started',
        currentSection: 'introduction',
        currentQuestion: 0,
        totalQuestions: assessmentData.totalQuestions || 0,
        completedQuestions: 0
      };

      await user.save();
      return user;
    } catch (error) {
      console.error('Error starting assessment:', error);
      throw error;
    }
  }

  // Update assessment progress
  async updateAssessmentProgress(userId, progressData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.currentAssessment && user.currentAssessment.assessmentId === progressData.assessmentId) {
        user.currentAssessment = {
          ...user.currentAssessment,
          ...progressData,
          status: 'in_progress'
        };
        await user.save();
      }

      return user;
    } catch (error) {
      console.error('Error updating assessment progress:', error);
      throw error;
    }
  }

  // Complete an assessment
  async completeAssessment(userId, assessmentData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.currentAssessment && user.currentAssessment.assessmentId === assessmentData.assessmentId) {
        // Move current assessment to history
        const completedAssessment = {
          assessmentId: user.currentAssessment.assessmentId,
          assessmentTitle: user.currentAssessment.assessmentTitle,
          startedAt: user.currentAssessment.startedAt,
          completedAt: new Date(),
          duration: Math.round((new Date() - user.currentAssessment.startedAt) / (1000 * 60)), // Convert to minutes
          status: 'completed',
          overallScore: assessmentData.overallScore,
          categoryScores: assessmentData.categoryScores,
          recommendation: assessmentData.recommendation,
          recommendationReason: assessmentData.recommendationReason
        };

        user.assessmentHistory.push(completedAssessment);
        user.currentAssessment = null; // Clear current assessment
        await user.save();
      }

      return user;
    } catch (error) {
      console.error('Error completing assessment:', error);
      throw error;
    }
  }

  // Save assessment feedback
  async saveAssessmentFeedback(userId, assessmentId, feedback) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find the assessment in history and add feedback
      const assessment = user.assessmentHistory.find(a => a.assessmentId === assessmentId);
      if (assessment) {
        assessment.feedback = {
          rating: feedback.rating,
          comments: feedback.comments,
          submittedAt: new Date()
        };
        await user.save();
      }

      return user;
    } catch (error) {
      console.error('Error saving assessment feedback:', error);
      throw error;
    }
  }

  // Get user's assessment history
  async getUserAssessmentHistory(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.assessmentHistory || [];
    } catch (error) {
      console.error('Error getting user assessment history:', error);
      throw error;
    }
  }

  // Get user's current assessment
  async getCurrentAssessment(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.currentAssessment;
    } catch (error) {
      console.error('Error getting current assessment:', error);
      throw error;
    }
  }

  // Abandon current assessment
  async abandonAssessment(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.currentAssessment) {
        // Move to history as abandoned
        const abandonedAssessment = {
          assessmentId: user.currentAssessment.assessmentId,
          assessmentTitle: user.currentAssessment.assessmentTitle,
          startedAt: user.currentAssessment.startedAt,
          completedAt: new Date(),
          duration: Math.round((new Date() - user.currentAssessment.startedAt) / (1000 * 60)),
          status: 'abandoned'
        };

        user.assessmentHistory.push(abandonedAssessment);
        user.currentAssessment = null;
        await user.save();
      }

      return user;
    } catch (error) {
      console.error('Error abandoning assessment:', error);
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
