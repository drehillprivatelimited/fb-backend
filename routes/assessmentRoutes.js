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
