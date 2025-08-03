import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Path Finder Team'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: [
      'Career Guidance',
      'Entrance Exams',
      'Psychology',
      'Study Tips',
      'Skill Development',
      'Success Stories',
      'Technology',
      'Education',
      'Assessment Science', 
      'Assessment Guide',
      'Career Spotlight',
      'Industry Insights',
      'Student Resources',
      'Professional Development'
    ],
    default: 'Career Guidance'
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  featuredImage: {
    type: String,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  sections: [{
    type: {
      type: String,
      enum: ['heading', 'paragraph', 'list', 'subheading', 'image', 'quote'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    level: {
      type: Number,
      default: 1
    },
    imageUrl: String,
    imageAlt: String
  }],
  attachments: [attachmentSchema],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Create slug from title before saving
blogPostSchema.pre('validate', function(next) {
  if (this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (this.isModified('isPublished') && this.isPublished) {
    this.publishedAt = new Date();
  }
  next();
});

// Format content and calculate reading time before saving
blogPostSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate reading time
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${minutes} min read`;

    // Parse content into sections
    const sections = [];
    const lines = this.content.split('\n');
    let currentSection = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Check for main headings (starts with "The" or specific titles)
      if (trimmedLine.startsWith('The ') || 
          trimmedLine === 'Implementation for Ambitious Professionals' ||
          trimmedLine === 'The Competitive Edge' ||
          trimmedLine === 'Conclusion: The Rest Paradox' ||
          /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(trimmedLine)) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'heading',
          content: trimmedLine,
          level: 1
        };
      }
      // Check for numbered subsections
      else if (/^\d+\./.test(trimmedLine)) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'subheading',
          content: trimmedLine,
          level: 2
        };
      }
      // Check for lists
      else if (trimmedLine.includes('Decision quality') || 
               trimmedLine.includes('Schedule recovery') ||
               trimmedLine.includes('Creative problem-solving') ||
               trimmedLine.includes('Working memory') ||
               trimmedLine.startsWith('- ') ||
               trimmedLine.startsWith('• ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'list',
          content: trimmedLine,
          level: 2
        };
      }
      // Regular paragraph
      else {
        if (currentSection && currentSection.type === 'paragraph') {
          currentSection.content += '\n' + trimmedLine;
        } else {
          if (currentSection) sections.push(currentSection);
          currentSection = {
            type: 'paragraph',
            content: trimmedLine,
            level: 1
          };
        }
      }
    });

    if (currentSection) sections.push(currentSection);
    this.sections = sections;
  }
  next();
});

// Index for better query performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ isPublished: 1, date: -1 });
blogPostSchema.index({ category: 1, isPublished: 1 });
blogPostSchema.index({ featured: 1, isPublished: 1 });

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost; 