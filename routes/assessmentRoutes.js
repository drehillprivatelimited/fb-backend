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
router.get('/:id', async (req, res) => {
  console.log(`GET /api/assessments/${req.params.id} - Fetching assessment`);
  try {
    const { id } = req.params;
    const assessment = await assessmentService.getAssessmentById(id);
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
router.post('/:id/start', async (req, res) => {
  console.log(`POST /api/assessments/${req.params.id}/start - Starting assessment session`);
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const metadata = {
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection.remoteAddress || '',
      referrer: req.headers.referer || '',
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
    };

    const session = await assessmentService.startAssessmentSession(id, userId, metadata);
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
router.post('/:id/submit', async (req, res) => {
  console.log(`POST /api/assessments/${req.params.id}/submit - Submitting assessment answers`);
  try {
    const { id } = req.params;
    const { sessionId, answers } = req.body;

    if (!sessionId || !answers) {
      return res.status(400).json({ 
        message: 'Session ID and answers are required' 
      });
    }

    const result = await assessmentService.submitAssessment(sessionId, answers);
    res.json(result);
  } catch (error) {
    console.error('Error submitting assessment:', error);
    if (error.message.includes('Session not found')) {
      res.status(404).json({ 
        message: 'Session not found' 
      });
    } else if (error.message.includes('already completed')) {
      res.status(400).json({ 
        message: 'Assessment already completed' 
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
router.get('/:id/results/:sessionId', async (req, res) => {
  console.log(`GET /api/assessments/${req.params.id}/results/${req.params.sessionId} - Fetching assessment results`);
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

// Get assessment categories
router.get('/categories/list', async (req, res) => {
  console.log('GET /api/assessments/categories/list - Fetching assessment categories');
  try {
    const categories = [
      'Cloud',
      'Data', 
      'Technology',
      'Programming',
      'Management',
      'Business',
      'Medical',
      'Platform'
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
      categories: ['Cloud', 'Data', 'Technology', 'Programming', 'Management', 'Business', 'Medical', 'Platform']
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
