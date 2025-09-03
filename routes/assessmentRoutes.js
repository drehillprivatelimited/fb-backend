import express from 'express';
import assessmentService from '../services/assessmentService.js';

const router = express.Router();

// Get all assessments
router.get('/', async (req, res) => {
  console.log('GET /api/assessments - Fetching all assessments');
  try {
    const assessments = await assessmentService.getAllAssessments();
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ 
      message: 'Error fetching assessments', 
      error: error.message 
    });
  }
});

// Get assessments by category
router.get('/category/:category', async (req, res) => {
  console.log(`GET /api/assessments/category/${req.params.category} - Fetching assessments by category`);
  try {
    const { category } = req.params;
    const assessments = await assessmentService.getAssessmentsByCategory(category);
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments by category:', error);
    res.status(500).json({ 
      message: 'Error fetching assessments by category', 
      error: error.message 
    });
  }
});

// Get featured assessments
router.get('/featured', async (req, res) => {
  console.log('GET /api/assessments/featured - Fetching featured assessments');
  try {
    const assessments = await assessmentService.getFeaturedAssessments();
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching featured assessments:', error);
    res.status(500).json({ 
      message: 'Error fetching featured assessments', 
      error: error.message 
    });
  }
});

// Get specific assessment with sections
router.get('/:assessmentId', async (req, res) => {
  console.log(`GET /api/assessments/${req.params.assessmentId} - Fetching assessment`);
  try {
    const { assessmentId } = req.params;
    const assessment = await assessmentService.getAssessmentById(assessmentId);
    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    if (error.message === 'Assessment not found') {
      res.status(404).json({ 
        message: 'Assessment not found' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error fetching assessment', 
        error: error.message 
      });
    }
  }
});

// Start assessment session
router.post('/:assessmentId/start', async (req, res) => {
  console.log(`POST /api/assessments/${req.params.assessmentId}/start - Starting assessment session`);
  try {
    const { assessmentId } = req.params;
    const { userId, userEmail } = req.body;
    const metadata = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection.remoteAddress || '',
      referrer: req.headers.referer || '',
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
    };

    const session = await assessmentService.startAssessmentSession(assessmentId, userId, metadata);
    
    // If user ID is provided, add the assessment session to user's record
    if (userId) {
      try {
        const userService = (await import('../services/userService.js')).default;
        await userService.addAssessmentSession(userId, session.sessionId);
      } catch (userError) {
        console.error('Error adding assessment session to user:', userError);
        // Don't fail the assessment start if user update fails
      }
    }
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error starting assessment session:', error);
    if (error.message.includes('Assessment not found')) {
      res.status(404).json({ 
        message: 'Assessment not found or inactive' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error starting assessment session', 
        error: error.message 
      });
    }
  }
});

// Submit assessment answers
router.post('/:assessmentId/submit', async (req, res) => {
  console.log(`POST /api/assessments/${req.params.assessmentId}/submit - Submitting assessment answers`);
  try {
    const { assessmentId } = req.params;
    const { sessionId, answers, userId, feedback } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ 
        message: 'Session ID and answers are required' 
      });
    }

    const result = await assessmentService.submitAssessment(sessionId, answers, feedback);
    
    // If user ID is provided, mark the assessment as completed for the user
    if (userId) {
      try {
        const userService = (await import('../services/userService.js')).default;
        await userService.markAssessmentCompleted(userId);
      } catch (userError) {
        console.error('Error marking assessment as completed for user:', userError);
        // Don't fail the assessment submission if user update fails
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error submitting assessment:', error);
    if (error.message.includes('Session not found')) {
      res.status(404).json({ 
        message: 'Session not found' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error submitting assessment', 
        error: error.message 
      });
    }
  }
});

// Get assessment results
router.get('/:assessmentId/results/:sessionId', async (req, res) => {
  console.log(`GET /api/assessments/${req.params.assessmentId}/results/${req.params.sessionId} - Fetching assessment results`);
  try {
    const { sessionId } = req.params;
    const results = await assessmentService.getAssessmentResults(sessionId);
    res.json(results);
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    if (error.message.includes('Session not found')) {
      res.status(404).json({ 
        message: 'Session not found' 
      });
    } else if (error.message.includes('not completed')) {
      res.status(400).json({ 
        message: 'Assessment not completed' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error fetching assessment results', 
        error: error.message 
      });
    }
  }
});

// Save feedback only (for sessions that did not reach results)
router.post('/:assessmentId/feedback/:sessionId', async (req, res) => {
  console.log(`POST /api/assessments/${req.params.assessmentId}/feedback/${req.params.sessionId} - Saving feedback`);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request params:', JSON.stringify(req.params, null, 2));
  
  try {
    const { sessionId } = req.params;
    const { feedback } = req.body;
    
    console.log('Extracted sessionId:', sessionId);
    console.log('Extracted feedback:', JSON.stringify(feedback, null, 2));
    
    if (!feedback) {
      console.log('No feedback provided in request body');
      return res.status(400).json({ message: 'Feedback is required' });
    }
    
    console.log('Calling assessmentService.saveFeedback with:', { sessionId, feedback });
    const result = await assessmentService.saveFeedback(sessionId, feedback);
    console.log('saveFeedback result:', JSON.stringify(result, null, 2));
    
    res.json(result);
  } catch (error) {
    console.error('Error saving feedback:', error);
    console.error('Error stack:', error.stack);
    if (error.message.includes('Session not found')) {
      res.status(404).json({ message: 'Session not found' });
    } else {
      res.status(500).json({ message: 'Error saving feedback', error: error.message });
    }
  }
});

// Get assessment categories
router.get('/categories/list', async (req, res) => {
  console.log('GET /api/assessments/categories/list - Fetching assessment categories');
  try {
    const categories = [
      'Emerging Technologies',
      'Engineering & Manufacturing'
    ];
    res.json(categories);
  } catch (error) {
    console.error('Error fetching assessment categories:', error);
    res.status(500).json({ 
      message: 'Error fetching assessment categories', 
      error: error.message 
    });
  }
});

// Health check for assessments
router.get('/health/status', async (req, res) => {
  console.log('GET /api/assessments/health/status - Assessment health check');
  try {
    const totalAssessments = await assessmentService.getAllAssessments();
    const featuredAssessments = await assessmentService.getFeaturedAssessments();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      totalAssessments: totalAssessments.length,
      featuredAssessments: featuredAssessments.length,
      categories: [
        'Emerging Technologies',
        'Engineering & Manufacturing'
      ]
    });
  } catch (error) {
    console.error('Error in assessment health check:', error);
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Assessment service health check failed',
      error: error.message 
    });
  }
});

export default router;
