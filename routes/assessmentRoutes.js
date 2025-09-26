import express from 'express';
import assessmentService from '../services/assessmentService.js';
import Category from '../models/Category.js';

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
    
    // Convert slug to category name (e.g., "engineering-manufacturing" -> "Engineering Manufacturing")
    const categoryName = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    console.log(`Converted slug "${category}" to category name "${categoryName}"`);
    const assessments = await assessmentService.getAssessmentsByCategory(categoryName);
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

// Get specific assessment by category + id (new nested path support)
router.get('/category/:category/:assessmentId', async (req, res) => {
  const { category, assessmentId } = req.params;
  console.log(`GET /api/assessments/category/${category}/${assessmentId} - Fetching assessment by category and id`);
  try {
    // Convert slug to category name (e.g., "engineering-manufacturing" -> "Engineering Manufacturing")
    const expectedCategoryName = category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Fetch by id first (source of truth)
    const assessment = await assessmentService.getAssessmentById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // If a recognized category was provided, ensure it matches the document
    if (expectedCategoryName && assessment.category && assessment.category !== expectedCategoryName) {
      return res.status(400).json({ message: 'Category does not match assessment' });
    }

    return res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment by category and id:', error);
    const message = error.message === 'Assessment not found' ? 'Assessment not found' : 'Error fetching assessment';
    return res.status(error.message === 'Assessment not found' ? 404 : 500).json({ message, error: error.message });
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









// Get assessment categories dynamically from database
router.get('/categories/list', async (req, res) => {
  console.log('GET /api/assessments/categories/list - Fetching assessment categories');
  try {
    // Use imported Category model
    
    // Get categories from Category collection
    const categories = await Category.find({ isActive: true }).select('name').lean();
    const categoryNames = categories.map(cat => cat.name);
    
    res.json(categoryNames);
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
    
    // Get categories from Category collection
    const categories = await Category.find({ isActive: true }).select('name').lean();
    const categoryNames = categories.map(cat => cat.name);
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      totalAssessments: totalAssessments.length,
      featuredAssessments: featuredAssessments.length,
      categories: categoryNames
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
