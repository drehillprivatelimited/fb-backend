import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';

// Script to check all assessments in the database
async function checkAssessments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/path-finder');
    console.log('Connected to MongoDB');

    // Find all assessments
    const assessments = await Assessment.find({});

    console.log(`Found ${assessments.length} assessments in database:`);
    
    for (const assessment of assessments) {
      console.log(`\n--- Assessment: ${assessment.title} (ID: ${assessment.id}) ---`);
      console.log(`Category: ${assessment.category}`);
      console.log(`Active: ${assessment.isActive}`);
      
      if (assessment.assessmentOverview && assessment.assessmentOverview.modules) {
        console.log(`Modules: ${JSON.stringify(assessment.assessmentOverview.modules)}`);
      }
      
      if (assessment.sections && assessment.sections.wiscar) {
        console.log(`WISCAR Section Title: ${assessment.sections.wiscar.title}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking assessments:', error);
    process.exit(1);
  }
}

// Run the check function
checkAssessments();
