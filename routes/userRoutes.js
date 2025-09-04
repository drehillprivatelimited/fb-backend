import express from 'express';
import userService from '../services/userService.js';

const router = express.Router();

// Create or update user
router.post('/', async (req, res) => {
  console.log('POST /api/users - Creating/updating user');
  try {
    const { country, ageRange } = req.body;

    // Validate required fields
    if (!country || !ageRange) {
      return res.status(400).json({
        message: 'Country and age range are required'
      });
    }

    // Validate age range
    const validAgeRanges = ['11-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    if (!validAgeRanges.includes(ageRange)) {
      return res.status(400).json({
        message: 'Please provide a valid age range'
      });
    }

    const user = await userService.createOrUpdateUser({ country, ageRange });
    
    res.status(201).json({
      message: 'User created/updated successfully',
      user: {
        id: user._id,
        country: user.country,
        ageRange: user.ageRange,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({
      message: 'Error creating/updating user',
      error: error.message
    });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  return res.status(410).json({ message: 'Lookup by email is no longer supported' });
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
        country: user.country,
        ageRange: user.ageRange,
        createdAt: user.createdAt,

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
        country: user.country,
        createdAt: user.createdAt,
        currentAssessment: user.currentAssessment,
        assessmentStatus: user.currentAssessment ? 
          (user.currentAssessment.isCompleted ? 'Completed' : 'In Progress') : 
          'No Assessment'
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

// Start an assessment
router.post('/:id/start-assessment', async (req, res) => {
  console.log(`POST /api/users/${req.params.id}/start-assessment - Starting assessment`);
  try {
    const { id } = req.params;
    const { assessmentId, assessmentTitle } = req.body;
    
    if (!assessmentId || !assessmentTitle) {
      return res.status(400).json({
        message: 'Assessment ID and title are required'
      });
    }
    
    const user = await userService.startAssessment(id, {
      assessmentId,
      assessmentTitle
    });
    
    res.json({
      message: 'Assessment started successfully',
      currentAssessment: user.currentAssessment
    });
  } catch (error) {
    console.error('Error starting assessment:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        message: 'Error starting assessment',
        error: error.message
      });
    }
  }
});

// Complete an assessment with feedback
router.post('/:id/complete-assessment', async (req, res) => {
  console.log(`POST /api/users/${req.params.id}/complete-assessment - Completing assessment`);
  try {
    const { id } = req.params;
    const { assessmentId, feedback } = req.body;
    
    if (!assessmentId || !feedback) {
      return res.status(400).json({
        message: 'Assessment ID and feedback are required'
      });
    }
    
    const user = await userService.completeAssessment(id, assessmentId, feedback);
    
    res.json({
      message: 'Assessment completed successfully',
      currentAssessment: user.currentAssessment
    });
  } catch (error) {
    console.error('Error completing assessment:', error);
    if (error.message === 'User not found') {
      res.status(404).json({
        message: 'User not found'
      });
    } else {
      res.status(500).json({
        message: 'Error completing assessment',
        error: error.message
      });
    }
  }
});

// Get user's current assessment status
router.get('/:id/assessment-status', async (req, res) => {
  console.log(`GET /api/users/${req.params.id}/assessment-status - Getting assessment status`);
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json({
      userId: id,
      currentAssessment: user.currentAssessment,
      status: user.currentAssessment ? 
        (user.currentAssessment.isCompleted ? 'Completed' : 'In Progress') : 
        'No Assessment'
    });
  } catch (error) {
    console.error('Error getting assessment status:', error);
    res.status(500).json({
      message: 'Error getting assessment status',
      error: error.message
    });
  }
});

export default router;
