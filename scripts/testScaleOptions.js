import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';

// Test function to verify scale options
async function testScaleOptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/path-finder');
    console.log('Connected to MongoDB');

    // Get the sample assessment
    const assessment = await Assessment.findOne({ id: 'python-programming-fit' });
    
    if (!assessment) {
      console.log('Assessment not found. Please run the sample data script first.');
      return;
    }

    console.log('Assessment found:', assessment.title);
    console.log('\n=== Testing Scale Options ===\n');

    // Test psychometric section
    if (assessment.sections.psychometric) {
      console.log('Psychometric Section Questions:');
      assessment.sections.psychometric.questions.forEach((question, index) => {
        console.log(`\nQuestion ${index + 1}: ${question.text}`);
        console.log(`Type: ${question.type}`);
        
        if (question.type === 'likert' && question.scale) {
          console.log('Scale Options:');
          if (question.scale.scaleOptions && question.scale.scaleOptions.length > 0) {
            question.scale.scaleOptions.forEach(option => {
              console.log(`  ${option.value}: ${option.label}`);
            });
          } else {
            console.log('  No scale options found!');
          }
        }
      });
    }

    // Test FB6 Index section
    if (assessment.sections.wiscar) {
      console.log('\nFB6 Index Section Questions:');
      assessment.sections.wiscar.questions.forEach((question, index) => {
        console.log(`\nQuestion ${index + 1}: ${question.text}`);
        console.log(`Type: ${question.type}`);
        
        if (question.type === 'likert' && question.scale) {
          console.log('Scale Options:');
          if (question.scale.scaleOptions && question.scale.scaleOptions.length > 0) {
            question.scale.scaleOptions.forEach(option => {
              console.log(`  ${option.value}: ${option.label}`);
            });
          } else {
            console.log('  No scale options found!');
          }
        }
      });
    }

    console.log('\n=== Test Complete ===');
    process.exit(0);
  } catch (error) {
    console.error('Error testing scale options:', error);
    process.exit(1);
  }
}

// Run the test
testScaleOptions();
