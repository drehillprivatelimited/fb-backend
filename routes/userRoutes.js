import express from 'express';
import userService from '../services/userService.js';

const router = express.Router();

// Create or update user
router.post('/', async (req, res) => {
  console.log('POST /api/users - Creating/updating user');
  try {
    const { name, email, ageRange } = req.body;

    // Validate required fields
    if (!name || !email || !ageRange) {
      return res.status(400).json({
        message: 'Name, email, and age range are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    // Validate age range
    const validAgeRanges = ['11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '100+'];
    if (!validAgeRanges.includes(ageRange)) {
      return res.status(400).json({
        message: 'Please provide a valid age range'
      });
    }

    const user = await userService.createOrUpdateUser({ name, email, ageRange });
    
    res.status(201).json({
      message: 'User created/updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ageRange: user.ageRange,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({
      message: 'Error creating/updating user',
      error: error.message
    });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  console.log(`GET /api/users/email/${req.params.email} - Getting user by email`);
  try {
    const { email } = req.params;
    const user = await userService.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ageRange: user.ageRange,
        createdAt: user.createdAt,
        totalAssessments: user.totalAssessments,
        completedAssessments: user.completedAssessments
      }
    });
  } catch (error) {
    console.error('Error getting user by email:', error);
    res.status(500).json({
      message: 'Error getting user',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  console.log(`GET /api/users/${req.params.id} - Getting user by ID`);
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ageRange: user.ageRange,
        createdAt: user.createdAt,
        totalAssessments: user.totalAssessments,
        completedAssessments: user.completedAssessments,
        lastAssessmentDate: user.lastAssessmentDate
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      message: 'Error getting user',
      error: error.message
    });
  }
});

// Get user analytics
router.get('/:id/analytics', async (req, res) => {
  console.log(`GET /api/users/${req.params.id}/analytics - Getting user analytics`);
  try {
    const { id } = req.params;
    const analytics = await userService.getUserAnalytics(id);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting user analytics:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        message: 'Error getting user analytics',
        error: error.message
      });
    }
  }
});

// Add assessment session to user
router.post('/:id/assessment-session', async (req, res) => {
  console.log(`POST /api/users/${req.params.id}/assessment-session - Adding assessment session`);
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        message: 'Session ID is required'
      });
    }
    
    const user = await userService.addAssessmentSession(id, sessionId);
    
    res.json({
      message: 'Assessment session added successfully',
      user: {
        id: user._id,
        totalAssessments: user.totalAssessments,
        lastAssessmentDate: user.lastAssessmentDate
      }
    });
  } catch (error) {
    console.error('Error adding assessment session:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        message: 'Error adding assessment session',
        error: error.message
      });
    }
  }
});

// Mark assessment as completed
router.post('/:id/complete-assessment', async (req, res) => {
  console.log(`POST /api/users/${req.params.id}/complete-assessment - Marking assessment as completed`);
  try {
    const { id } = req.params;
    const user = await userService.markAssessmentCompleted(id);
    
    res.json({
      message: 'Assessment marked as completed',
      user: {
        id: user._id,
        completedAssessments: user.completedAssessments
      }
    });
  } catch (error) {
    console.error('Error marking assessment as completed:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        message: 'Error marking assessment as completed',
        error: error.message
      });
    }
  }
});

// Get all users (admin only)
router.get('/', async (req, res) => {
  console.log('GET /api/users - Getting all users');
  try {
    const { limit = 50, skip = 0 } = req.query;
    const result = await userService.getAllUsers(parseInt(limit), parseInt(skip));
    
    res.json(result);
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      message: 'Error getting users',
      error: error.message
    });
  }
});

// Get users by age range
router.get('/age-range/:ageRange', async (req, res) => {
  console.log(`GET /api/users/age-range/${req.params.ageRange} - Getting users by age range`);
  try {
    const { ageRange } = req.params;
    const users = await userService.getUsersByAgeRange(ageRange);
    
    res.json({
      ageRange,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalAssessments: user.totalAssessments,
        completedAssessments: user.completedAssessments
      }))
    });
  } catch (error) {
    console.error('Error getting users by age range:', error);
    res.status(500).json({
      message: 'Error getting users by age range',
      error: error.message
    });
  }
});

export default router;
