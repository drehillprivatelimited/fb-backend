import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';

// Sample assessment data with new 1-7 scale structure
const sampleAssessment = {
  id: 'python-programming-fit',
  title: 'Python Programming Fit Assessment',
  description: 'Discover if Python programming aligns with your learning style and career goals',
  category: 'Programming',
  duration: '10-15 mins',
  difficulty: 'Beginner',
  isActive: true,
  featured: true,
  metadata: {
    icon: 'code',
    gradient: 'from-green-500 to-blue-600',
    userCount: '5K+',
    tags: ['Python', 'Programming', 'Career Fit']
  },
  whatIsDescription: 'This assessment evaluates your compatibility with Python programming careers through psychological, technical, and comprehensive analysis.',
  typicalCareers: [
    { title: 'Python Developer', description: 'Build applications and systems using Python' },
    { title: 'Data Scientist', description: 'Analyze data and create machine learning models' },
    { title: 'Backend Engineer', description: 'Develop server-side applications and APIs' }
  ],
  whoShouldConsider: [
    'Students interested in programming',
    'Career changers looking for tech opportunities',
    'Anyone curious about Python development'
  ],
  idealTraits: [
    'Logical thinking',
    'Problem-solving skills',
    'Attention to detail',
    'Continuous learning mindset'
  ],
  assessmentOverview: {
    modules: ['Psychological Fit', 'Technical Aptitude', 'FB6 Index Analysis'],
    resultsInclude: ['Career Recommendations', 'Skill Gap Analysis', 'Learning Path']
  },
  sections: {
    psychometric: {
      title: 'Psychological Fit',
      description: 'Evaluate your personality traits and learning preferences for Python programming',
      type: 'psychometric',
      weight: 25,
      orderIndex: 1,
      questions: [
        {
          id: 'psych-1',
          text: 'I enjoy solving complex problems step by step',
          type: 'likert',
          category: 'personality',
          subcategory: 'problem-solving',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.2,
          orderIndex: 1
        },
        {
          id: 'psych-2',
          text: 'I prefer learning through hands-on practice rather than just reading',
          type: 'likert',
          category: 'learning-style',
          subcategory: 'practical',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 2
        },
        {
          id: 'psych-3',
          text: 'I can stay focused on a task for extended periods',
          type: 'likert',
          category: 'personality',
          subcategory: 'focus',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.1,
          orderIndex: 3
        }
      ],
      scoringConfig: {
        algorithm: 'weighted-sum',
        thresholds: {
          excellent: 18,
          good: 14,
          needsImprovement: 10
        }
      }
    },
    technical: {
      title: 'Technical Aptitude',
      description: 'Assess your logical thinking and basic programming concepts',
      type: 'technical',
      weight: 30,
      orderIndex: 2,
      questions: [
        {
          id: 'tech-1',
          text: 'What is the result of: 2 + 3 * 4?',
          type: 'multiple-choice',
          category: 'logical-thinking',
          subcategory: 'math',
          options: [
            { id: 'a', text: '20', value: '20', score: 0 },
            { id: 'b', text: '14', value: '14', score: 100 },
            { id: 'c', text: '24', value: '24', score: 0 },
            { id: 'd', text: '28', value: '28', score: 0 }
          ],
          required: true,
          weight: 1.5,
          orderIndex: 1
        },
        {
          id: 'tech-2',
          text: 'In programming, what does a "variable" store?',
          type: 'multiple-choice',
          category: 'programming-concepts',
          subcategory: 'basics',
          options: [
            { id: 'a', text: 'Only numbers', value: 'numbers', score: 0 },
            { id: 'b', text: 'Only text', value: 'text', score: 0 },
            { id: 'c', text: 'Data or values', value: 'data', score: 100 },
            { id: 'd', text: 'Only files', value: 'files', score: 0 }
          ],
          required: true,
          weight: 1.2,
          orderIndex: 2
        }
      ],
      scoringConfig: {
        algorithm: 'weighted-sum',
        thresholds: {
          excellent: 200,
          good: 150,
          needsImprovement: 100
        }
      }
    },
    wiscar: {
      title: 'FB6 Index Analysis',
      description: 'Comprehensive evaluation across 6 key dimensions',
      type: 'wiscar',
      weight: 25,
      orderIndex: 3,
      questions: [
        {
          id: 'wiscar-1',
          text: 'I am motivated to learn new programming languages and technologies',
          type: 'likert',
          category: 'will',
          subcategory: 'motivation',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 1
        },
        {
          id: 'wiscar-2',
          text: 'I find programming and coding interesting and engaging',
          type: 'likert',
          category: 'interest',
          subcategory: 'programming',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 2
        },
        {
          id: 'wiscar-3',
          text: 'I have experience with basic programming concepts',
          type: 'likert',
          category: 'skill',
          subcategory: 'experience',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 3
        },
        {
          id: 'wiscar-4',
          text: 'I can think logically and solve problems systematically',
          type: 'likert',
          category: 'cognitive',
          subcategory: 'logic',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 4
        },
        {
          id: 'wiscar-5',
          text: 'I have the ability to learn complex technical concepts',
          type: 'likert',
          category: 'ability',
          subcategory: 'learning',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 5
        },
        {
          id: 'wiscar-6',
          text: 'I can apply programming knowledge to real-world problems',
          type: 'likert',
          category: 'realWorld',
          subcategory: 'application',
          scale: {
            min: 1,
            max: 7,
            labels: {
              min: 'Strongly Disagree',
              max: 'Strongly Agree'
            }
          },
          required: true,
          weight: 1.0,
          orderIndex: 6
        }
      ],
      scoringConfig: {
        algorithm: 'wiscar-weighted',
        dimensions: ['will', 'interest', 'skill', 'cognitive', 'ability', 'realWorld']
      }
    }
  }
};

// Function to seed the database
async function seedAssessmentData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/path-finder');
    console.log('Connected to MongoDB');

    // Check if assessment already exists
    const existingAssessment = await Assessment.findOne({ id: sampleAssessment.id });
    
    if (existingAssessment) {
      console.log('Assessment already exists, updating...');
      await Assessment.findOneAndUpdate(
        { id: sampleAssessment.id },
        sampleAssessment,
        { new: true, upsert: true }
      );
    } else {
      console.log('Creating new assessment...');
      await Assessment.create(sampleAssessment);
    }

    console.log('Sample assessment data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedAssessmentData();
