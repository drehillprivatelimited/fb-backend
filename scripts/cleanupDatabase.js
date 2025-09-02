import mongoose from 'mongoose';
import Assessment from '../models/Assessment.js';
import AssessmentSession from '../models/AssessmentSession.js';
import User from '../models/User.js';
import BlogPost from '../models/BlogPost.js';
import Contact from '../models/Contact.js';
import Subscriber from '../models/Subscriber.js';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/factorbeam';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // 1. Check for duplicate collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Current collections:', collections.map(c => c.name));
    
    // 2. Remove orphaned UnifiedAssessment collection if it exists
    try {
      const unifiedAssessmentCount = await mongoose.connection.db.collection('unifiedassessments').countDocuments();
      if (unifiedAssessmentCount > 0) {
        console.log(`🗑️  Removing ${unifiedAssessmentCount} orphaned UnifiedAssessment documents...`);
        await mongoose.connection.db.collection('unifiedassessments').drop();
        console.log('✅ UnifiedAssessment collection removed');
      }
    } catch (error) {
      console.log('ℹ️  UnifiedAssessment collection not found or already removed');
    }
    
    // 3. Remove orphaned AssessmentSection collection if it exists
    try {
      const assessmentSectionCount = await mongoose.connection.db.collection('assessmentsections').countDocuments();
      if (assessmentSectionCount > 0) {
        console.log(`🗑️  Removing ${assessmentSectionCount} orphaned AssessmentSection documents...`);
        await mongoose.connection.db.collection('assessmentsections').drop();
        console.log('✅ AssessmentSection collection removed');
      }
    } catch (error) {
      console.log('ℹ️  AssessmentSection collection not found or already removed');
    }
    
    // 4. Verify final state
    const finalAssessmentCount = await Assessment.countDocuments();
    
    console.log('\n📊 Final collection status:');
    console.log(`✅ Assessments: ${finalAssessmentCount}`);
    console.log(`✅ AssessmentSessions: ${await AssessmentSession.countDocuments()}`);
    console.log(`✅ Users: ${await User.countDocuments()}`);
    console.log(`✅ BlogPosts: ${await BlogPost.countDocuments()}`);
    console.log(`✅ Contacts: ${await Contact.countDocuments()}`);
    console.log(`✅ Subscribers: ${await Subscriber.countDocuments()}`);
    
    // 5. List final collections
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Final collections:', finalCollections.map(c => c.name));
    
    console.log('\n🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
  connectDB().then(cleanupDatabase);
}

export default cleanupDatabase;
