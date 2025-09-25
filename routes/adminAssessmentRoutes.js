import Assessment from '../models/Assessment.js';

import { verifyAdmin } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

// Get all assessments (admin)
router.get('/', verifyAdmin, async (req, res) => {
  console.log('GET /api/admin/assessments - Fetching all assessments (admin)');
  try {
    const assessments = await Assessment.find().sort({ createdAt: -1 });
    console.log(`Found ${assessments.length} assessments`);
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments (admin):', error);
    res.status(500).json({ 
      message: 'Error fetching assessments', 
      error: error.message 
    });
  }
});

// Get specific assessment with sections (admin)
router.get('/:id', verifyAdmin, async (req, res) => {
  console.log(`GET /api/admin/assessments/${req.params.id} - Fetching assessment (admin)`);
  try {
    const { id } = req.params;
    const assessmentData = await Assessment.findOne({ id });
    
    if (!assessmentData) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    console.log('Assessment found:', assessmentData.title);
    
    // The assessment should have embedded sections
    if (assessmentData.sections) {
      console.log('Assessment has embedded sections:', Object.keys(assessmentData.sections));
      res.json(assessmentData);
    } else {
      // If no embedded sections, return assessment with default section structure
      const defaultSections = {
        introduction: {
          title: 'Introduction',
          description: 'Welcome to your career readiness assessment',
          type: 'introduction',
          weight: 0,
          orderIndex: 1,
          questions: []
        },
        psychometric: {
          title: 'Psychological Fit',
          description: 'Assess your personality compatibility with AI/ML careers',
          type: 'psychometric',
          weight: 25,
          orderIndex: 2,
          questions: []
        },
        technical: {
          title: 'Technical Aptitude',
          description: 'Evaluate your coding, math, and ML knowledge',
          type: 'technical',
          weight: 30,
          orderIndex: 3,
          questions: []
        },
        wiscar: {
          title: 'FB6 Index Analysis',
          description: 'Comprehensive evaluation across 6 key dimensions',
          type: 'wiscar',
          weight: 25,
          orderIndex: 4,
          questions: []
        },
        results: {
          title: 'Your Results',
          description: 'Review your assessment results and recommendations',
          type: 'results',
          weight: 10,
          orderIndex: 5,
          questions: []
        }
      };
      
      res.json({
        ...assessmentData,
        sections: defaultSections
      });
    }
  } catch (error) {
    console.error('Error fetching assessment (admin):', error);
    res.status(500).json({ 
      message: 'Error fetching assessment', 
      error: error.message 
    });
  }
});

// Test endpoint to check data structure
router.post('/test', verifyAdmin, async (req, res) => {
  console.log('Test endpoint - received data:', JSON.stringify(req.body, null, 2));
  
  // Test creating an assessment with the received data
  try {
    const assessmentData = {
      ...req.body,
      id: req.body.id || `test-${Date.now()}`,
      title: req.body.title || 'Test Assessment',
      description: req.body.description || 'Test Description',
      category: req.body.category || 'General'
    };
    
    console.log('Test assessment data:', JSON.stringify(assessmentData, null, 2));
    
    const assessment = new Assessment(assessmentData);
    const validationError = assessment.validateSync();
    
    if (validationError) {
      console.error('Test validation error:', validationError);
      return res.json({ 
        message: 'Test validation failed', 
        errors: validationError.errors,
        receivedData: req.body 
      });
    }
    
    res.json({ 
      message: 'Test validation passed', 
      receivedData: req.body,
      assessmentData: assessmentData
    });
  } catch (error) {
    console.error('Test error:', error);
    res.json({ 
      message: 'Test error', 
      error: error.message,
      receivedData: req.body 
    });
  }
});

// Create new assessment (admin)
router.post('/', verifyAdmin, async (req, res) => {
  console.log('POST /api/admin/assessments - Creating new assessment');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  try {
    const {
      id,
      title,
      description,
      category,
      duration,
      difficulty,
      featured,
      metadata,
      whatIsDescription,
      typicalCareers,
      whoShouldConsider,
      idealTraits,
      assessmentOverview,
      sections
    } = req.body;
    
    if (!id || !title || !description || !category) {
      return res.status(400).json({ 
        message: 'ID, title, description, and category are required' 
      });
    }
    
    // Check if assessment with this ID already exists
    const existingAssessment = await Assessment.findOne({ id });
    if (existingAssessment) {
      return res.status(400).json({ 
        message: 'Assessment with this ID already exists' 
      });
    }
    
    // Create assessment with all fields including sections
    const assessmentData = {
      id,
      title,
      description,
      category,
      duration: duration || '10-15 mins',
      difficulty: difficulty || 'Intermediate',
      featured: featured || false,
      metadata: metadata || {},
      whatIsDescription: whatIsDescription || '',
      typicalCareers: typicalCareers || [],
      whoShouldConsider: whoShouldConsider || [],
      idealTraits: idealTraits || [],
      assessmentOverview: assessmentOverview || { modules: [], resultsInclude: [] },
      sections: sections || {
        introduction: {
          title: 'Introduction',
          description: 'Welcome to your career readiness assessment',
          type: 'introduction',
          weight: 0,
          orderIndex: 1,
          questions: []
        },
        psychometric: {
          title: 'Psychological Fit',
          description: 'Assess your personality compatibility with AI/ML careers',
          type: 'psychometric',
          weight: 25,
          orderIndex: 2,
          questions: []
        },
        technical: {
          title: 'Technical Aptitude',
          description: 'Evaluate your coding, math, and ML knowledge',
          type: 'technical',
          weight: 30,
          orderIndex: 3,
          questions: []
        },
        wiscar: {
          title: 'FB6 Index Analysis',
          description: 'Comprehensive evaluation across 6 key dimensions',
          type: 'wiscar',
          weight: 25,
          orderIndex: 4,
          questions: []
        },
        results: {
          title: 'Your Results',
          description: 'Review your assessment results and recommendations',
          type: 'results',
          weight: 10,
          orderIndex: 5,
          questions: []
        }
      }
    };

    console.log('Creating assessment with data:', JSON.stringify(assessmentData, null, 2));
    console.log('Sections data:', JSON.stringify(assessmentData.sections, null, 2));
    
    const assessment = new Assessment(assessmentData);
    
    // Validate the assessment before saving
    const validationError = assessment.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message
        }))
      });
    }
    
    await assessment.save();
    console.log('Assessment created successfully:', assessment.title);
    console.log('Saved assessment sections:', JSON.stringify(assessment.sections, null, 2));
    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Assessment with this ID already exists' });
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    } else {
      res.status(500).json({ 
        message: 'Error creating assessment', 
        error: error.message,
        stack: error.stack
      });
    }
  }
});

// Update assessment (admin)
router.put('/:id', verifyAdmin, async (req, res) => {
  console.log(`PUT /api/admin/assessments/${req.params.id} - Updating assessment`);
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const assessment = await Assessment.findOne({ id });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Update assessment fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'id' && assessment.schema.paths[key]) {
        assessment[key] = updateData[key];
      }
    });
    
    assessment.updatedAt = new Date();
    await assessment.save();
    
    console.log('Assessment updated successfully:', assessment.title);
    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ 
      message: 'Error updating assessment', 
      error: error.message 
    });
  }
});

// Delete assessment (admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
  console.log(`DELETE /api/admin/assessments/${req.params.id} - Deleting assessment`);
  try {
    const { id } = req.params;
    
    const assessment = await Assessment.findOne({ id });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Delete the assessment
    await Assessment.deleteOne({ id });
    
    console.log('Assessment deleted successfully:', assessment.title);
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ 
      message: 'Error deleting assessment', 
      error: error.message 
    });
  }
});

// Create assessment section (admin)
router.post('/:id/sections', verifyAdmin, async (req, res) => {
  console.log(`POST /api/admin/assessments/${req.params.id}/sections - Creating assessment section`);
  try {
    const { id } = req.params;
    const {
      sectionId,
      title,
      description,
      type,
      weight,
      orderIndex,
      questions,
      scoringConfig
    } = req.body;
    
    if (!sectionId || !title || !description || !type) {
      return res.status(400).json({ 
        message: 'Section ID, title, description, and type are required' 
      });
    }
    
    // Verify assessment exists
    const assessment = await Assessment.findOne({ id });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check if section already exists
    const existingSection = assessment.sections.find(s => s.id === sectionId);
    if (existingSection) {
      return res.status(400).json({ 
        message: 'Section with this ID already exists' 
      });
    }
    
    const newSection = {
      id: sectionId,
      title,
      description,
      type,
      weight: weight || 25,
      orderIndex: orderIndex || 1,
      questions: questions || [],
      scoringConfig: scoringConfig || {
        algorithm: 'average',
        thresholds: { excellent: 80, good: 60, needsImprovement: 40 }
      }
    };
    
    assessment.sections.push(newSection);
    assessment.updatedAt = new Date();
    await assessment.save();
    
    console.log('Assessment section created successfully:', newSection.title);
    res.status(201).json(newSection);
  } catch (error) {
    console.error('Error creating assessment section:', error);
    res.status(500).json({ 
      message: 'Error creating assessment section', 
      error: error.message 
    });
  }
});

// Update assessment section (admin)
router.put('/:id/sections/:sectionId', verifyAdmin, async (req, res) => {
  console.log(`PUT /api/admin/assessments/${req.params.id}/sections/${req.params.sectionId} - Updating assessment section`);
  try {
    const { id, sectionId } = req.params;
    const updateData = req.body;
    
    const assessment = await Assessment.findOne({ id });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const sectionIndex = assessment.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Assessment section not found' });
    }
    
    // Update section fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'assessmentId' && key !== 'id' && assessment.schema.paths[key]) {
        assessment.sections[sectionIndex][key] = updateData[key];
      }
    });
    
    assessment.updatedAt = new Date();
    await assessment.save();
    
    console.log('Assessment section updated successfully:', assessment.sections[sectionIndex].title);
    res.json(assessment.sections[sectionIndex]);
  } catch (error) {
    console.error('Error updating assessment section:', error);
    res.status(500).json({ 
      message: 'Error updating assessment section', 
      error: error.message 
    });
  }
});

// Delete assessment section (admin)
router.delete('/:id/sections/:sectionId', verifyAdmin, async (req, res) => {
  console.log(`DELETE /api/admin/assessments/${req.params.id}/sections/${req.params.sectionId} - Deleting assessment section`);
  try {
    const { id, sectionId } = req.params;
    
    const assessment = await Assessment.findOne({ id });
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const initialSectionsLength = assessment.sections.length;
    assessment.sections = assessment.sections.filter(s => s.id !== sectionId);

    if (assessment.sections.length < initialSectionsLength) {
      assessment.updatedAt = new Date();
      await assessment.save();
      console.log('Assessment section deleted successfully:', assessment.sections.find(s => s.id === sectionId)?.title);
      res.json({ message: 'Assessment section deleted successfully' });
    } else {
      res.status(404).json({ message: 'Assessment section not found' });
    }
  } catch (error) {
    console.error('Error deleting assessment section:', error);
    res.status(500).json({ 
      message: 'Error deleting assessment section', 
      error: error.message 
    });
  }
});





export default router;
