import express from 'express';
import BlogPost from '../models/BlogPost.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import { upload, handleMulterError } from '../config/fileStorage.js';
import { sendBlogPostNotification } from '../utils/emailService.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Public routes (no auth required)
router.get('/posts/public', async (req, res) => {
  console.log('GET /api/blog/posts/public - Fetching public posts');
  try {
    const { page = 1, limit = 10, category, featured, search } = req.query;
    
    const filter = { isPublished: true };
    if (category && category !== 'All') filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const posts = await BlogPost.find(filter)
      .sort({ date: -1 })
      .select('title excerpt date slug category featuredImage tags author readTime featured')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await BlogPost.countDocuments(filter);
    
    console.log(`Found ${posts.length} public posts`);
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching public posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
});

// Get featured posts
router.get('/posts/featured', async (req, res) => {
  try {
    const posts = await BlogPost.find({ 
      isPublished: true, 
      featured: true 
    })
    .sort({ date: -1 })
    .select('title excerpt date slug category featuredImage tags author readTime')
    .limit(6);
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching featured posts:', error);
    res.status(500).json({ message: 'Error fetching featured posts', error: error.message });
  }
});

// Get blog categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get a single public blog post by slug
router.get('/posts/:slug/public', async (req, res) => {
  const { slug } = req.params;
  console.log(`GET /api/blog/posts/${slug}/public - Fetching public post by slug`);
  try {
    const post = await BlogPost.findOne({ slug, isPublished: true });
    if (!post) {
      console.log('Public post not found with slug:', slug);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment view count
    post.analytics.views += 1;
    await post.save();
    
    console.log('Public post found:', post.title);
    res.json(post);
  } catch (error) {
    console.error('Error fetching public post:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
});

// Get a single public blog post by ID (for backward compatibility)
router.get('/posts/:id/public', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/blog/posts/${id}/public - Fetching public post by ID`);
  try {
    // First try to find by ID
    let post = await BlogPost.findById(id);
    
    // If not found by ID, try to find by slug
    if (!post) {
      post = await BlogPost.findOne({ slug: id, isPublished: true });
    } else if (!post.isPublished) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (!post) {
      console.log('Public post not found with ID/slug:', id);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment view count
    post.analytics.views += 1;
    await post.save();
    
    console.log('Public post found:', post.title);
    res.json(post);
  } catch (error) {
    console.error('Error fetching public post:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
});

// Get posts by category (public)
router.get('/category/:category', async (req, res) => {
  console.log(`GET /api/blog/category/${req.params.category} - Fetching posts by category`);
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await BlogPost.find({ 
      category: req.params.category,
      isPublished: true 
    })
    .sort({ date: -1 })
    .select('title excerpt date slug category featuredImage tags author readTime')
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
    const total = await BlogPost.countDocuments({ 
      category: req.params.category,
      isPublished: true 
    });
    
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching posts by category:', error);
    res.status(500).json({ message: 'Error fetching posts by category', error: error.message });
  }
});

// Search posts
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const filter = {
      isPublished: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };
    
    const posts = await BlogPost.find(filter)
      .sort({ date: -1 })
      .select('title excerpt date slug category featuredImage tags author readTime')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await BlogPost.countDocuments(filter);
    
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      query: q
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ message: 'Error searching posts', error: error.message });
  }
});

// Protected routes (admin only)
// Get all blog posts (admin)
router.get('/posts', verifyAdmin, async (req, res) => {
  console.log('GET /api/blog/posts - Fetching all posts');
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    
    const filter = {};
    if (status === 'published') filter.isPublished = true;
    if (status === 'draft') filter.isPublished = false;
    if (category) filter.category = category;
    
    const posts = await BlogPost.find(filter)
      .sort({ date: -1 })
      .select('title excerpt content date slug category readTime featuredImage tags isPublished publishedAt featured analytics')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await BlogPost.countDocuments(filter);
    
    console.log(`Found ${posts.length} posts`);
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching blog posts', error: error.message });
  }
});

// Get a single blog post by ID (admin)
router.get('/posts/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/blog/posts/${id} - Fetching post by ID`);
  try {
    const post = await BlogPost.findById(id);
    
    if (!post) {
      console.log('Post not found with ID:', id);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log('Post found:', post.title);
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
});

// Get a single blog post by slug (admin)
router.get('/posts/slug/:slug', verifyAdmin, async (req, res) => {
  const { slug } = req.params;
  console.log(`GET /api/blog/posts/slug/${slug} - Fetching post by slug`);
  try {
    const post = await BlogPost.findOne({ slug });
    
    if (!post) {
      console.log('Post not found with slug:', slug);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log('Post found:', post.title);
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching blog post', error: error.message });
  }
});

// Create a new blog post (admin)
router.post('/posts', verifyAdmin, async (req, res) => {
  console.log('POST /api/blog/posts - Creating new post');
  try {
    const { 
      title, 
      content, 
      contentBlocks,
      excerpt, 
      isPublished,
      category,
      featuredImage,
      tags,
      date,
      author,
      featured,
      seo
    } = req.body;
    
    if (!title || !content || !excerpt) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Title, content, and excerpt are required' });
    }

    const post = new BlogPost({
      title,
      content,
      contentBlocks: contentBlocks || [],
      excerpt,
      isPublished: isPublished || false,
      category: category || 'Career Guidance',
      featuredImage,
      tags: tags || [],
      date: date || new Date(),
      author: author || 'Path Finder Team',
      featured: featured || false,
      seo: seo || {}
    });

    await post.save();
    console.log('Post created successfully:', post.title);
    
    // Send notification to subscribers if post is published
    if (isPublished) {
      try {
        // Send notification to admin
        await sendBlogPostNotification({
          title: post.title,
          excerpt: post.excerpt,
          author: post.author,
          slug: post.slug,
          url: `${process.env.FRONTEND_URL || 'https://factorbeam.com'}/blog/${post.slug}`
        });
        
        // Send notification to all subscribers
        const fetch = require('node-fetch');
        const notificationResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/subscribers/notify-blog-post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: post.title,
            excerpt: post.excerpt,
            author: post.author,
            slug: post.slug,
            url: `${process.env.FRONTEND_URL || 'https://factorbeam.com'}/blog/${post.slug}`
          }),
        });
        
        if (notificationResponse.ok) {
          console.log('Blog post notifications sent to subscribers');
        } else {
          console.error('Failed to send notifications to subscribers');
        }
      } catch (notificationError) {
        console.error('Error sending blog post notifications:', notificationError);
        // Don't fail the post creation if notifications fail
      }
    }
    
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'A post with this title already exists' });
    } else {
      res.status(500).json({ message: 'Error creating blog post', error: error.message });
    }
  }
});

// Update a blog post (admin)
router.put('/posts/:id', verifyAdmin, async (req, res) => {
  console.log(`PUT /api/blog/posts/${req.params.id} - Updating post`);
  try {
    const { 
      title, 
      content, 
      contentBlocks,
      excerpt, 
      isPublished,
      category,
      featuredImage,
      tags,
      date,
      publishedAt,
      author,
      featured,
      seo
    } = req.body;
    
    if (!title || !content || !excerpt) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Title, content, and excerpt are required' });
    }

    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ message: 'Blog post not found' });
    }

    post.title = title;
    post.content = content;
    post.contentBlocks = contentBlocks || post.contentBlocks;
    post.excerpt = excerpt;
    post.isPublished = isPublished;
    post.category = category || post.category;
    post.featuredImage = featuredImage || post.featuredImage;
    post.tags = tags || post.tags;
    post.date = date || post.date;
    post.author = author || post.author;
    post.featured = featured !== undefined ? featured : post.featured;
    post.seo = seo || post.seo;
    
    // Update publishedAt if post is being published
    if (isPublished && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    await post.save();
    console.log('Post updated successfully:', post.title);
    
    // Send notification to subscribers if post is being published
    if (isPublished && post.publishedAt) {
      try {
        // Send notification to admin
        await sendBlogPostNotification({
          title: post.title,
          excerpt: post.excerpt,
          author: post.author,
          slug: post.slug,
          url: `${process.env.FRONTEND_URL || 'https://factorbeam.com'}/blog/${post.slug}`
        });
        
        // Send notification to all subscribers
        const fetch = require('node-fetch');
        const notificationResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/subscribers/notify-blog-post`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: post.title,
            excerpt: post.excerpt,
            author: post.author,
            slug: post.slug,
            url: `${process.env.FRONTEND_URL || 'https://factorbeam.com'}/blog/${post.slug}`
          }),
        });
        
        if (notificationResponse.ok) {
          console.log('Blog post notifications sent to subscribers');
        } else {
          console.error('Failed to send notifications to subscribers');
        }
      } catch (notificationError) {
        console.error('Error sending blog post notifications:', notificationError);
        // Don't fail the post update if notifications fail
      }
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'A post with this title already exists' });
    } else {
      res.status(500).json({ message: 'Error updating blog post', error: error.message });
    }
  }
});

// Delete a blog post (admin)
router.delete('/posts/:id', verifyAdmin, async (req, res) => {
  console.log(`DELETE /api/blog/posts/${req.params.id} - Deleting post`);
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      console.log('Post not found');
      return res.status(404).json({ message: 'Blog post not found' });
    }
    console.log('Post deleted successfully:', post.title);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting blog post', error: error.message });
  }
});

// File upload route
router.post('/upload', verifyAdmin, upload.array('files', 5), async (req, res) => {
  console.log('Upload route hit:', {
    files: req.files,
    body: req.body
  });

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // If postId is provided, associate files with the post
    if (req.body.postId) {
      const post = await BlogPost.findById(req.body.postId);
      if (!post) {
        // Delete uploaded files if post not found
        req.files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if this is a cover image upload (single image file)
      const isCoverImage = req.files.length === 1 && 
                          req.files[0].mimetype.startsWith('image/') && 
                          req.body.isCoverImage === 'true';

      if (isCoverImage) {
        // Update the post's featuredImage
        post.featuredImage = `/api/blog/uploads/${req.files[0].filename}`;
        await post.save();
        
        console.log('Cover image updated:', post.featuredImage);
        
        res.json({
          message: 'Cover image uploaded successfully',
          featuredImage: post.featuredImage
        });
      } else {
        // Add new attachments to the post
        const newAttachments = req.files.map(file => ({
          name: file.originalname,
          url: `/api/blog/uploads/${file.filename}`,
          type: file.mimetype
        }));

        console.log('Adding attachments:', newAttachments);

        post.attachments = [...(post.attachments || []), ...newAttachments];
        await post.save();

        res.json({
          message: 'Files uploaded successfully',
          attachments: newAttachments
        });
      }
    } else {
      // For new posts, just return the file info without associating with a post
      const uploadedFiles = req.files.map(file => ({
        _id: file.filename, // Use filename as temporary ID
        name: file.originalname,
        url: `/api/blog/uploads/${file.filename}`,
        type: file.mimetype
      }));

      res.json({
        message: 'Files uploaded successfully',
        attachments: uploadedFiles
      });
    }
  } catch (error) {
    console.error('Error in upload route:', error);
    // Delete uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    res.status(500).json({ message: 'Error uploading files' });
  }
});

// Delete an attachment
router.delete('/posts/:postId/attachments/:attachmentId', verifyAdmin, async (req, res) => {
  try {
    const { postId, attachmentId } = req.params;
    
    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Find the attachment to delete
    const attachment = post.attachments.find(att => att._id.toString() === attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete the file from the filesystem
    const filePath = path.join(process.cwd(), attachment.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the attachment from the post
    post.attachments = post.attachments.filter(att => att._id.toString() !== attachmentId);
    await post.save();

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ message: 'Error deleting attachment', error: error.message });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  
  console.log('Serving file:', filename);
  console.log('File path:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).json({ message: 'File not found' });
  }

  res.sendFile(filePath);
});

export default router; 