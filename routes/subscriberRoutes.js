import express from 'express';
import Subscriber from '../models/Subscriber.js';
import { sendNewsletterConfirmation, sendNewsletter, sendNewBlogPostToSubscribers } from '../utils/emailService.js';

const router = express.Router();

// Subscribe to newsletter (root endpoint for frontend compatibility)
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'Email already subscribed' });
    }

    // Create new subscriber
    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      subscribedAt: new Date()
    });

    await subscriber.save();

    // Send welcome email
    try {
      await sendNewsletterConfirmation({ email, name: email.split('@')[0] });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if welcome email fails
    }

    res.status(201).json({ 
      message: 'Successfully subscribed to newsletter',
      subscriber: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt
      }
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter' });
  }
});

// Subscribe to newsletter (alternative endpoint)
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existingSubscriber) {
      return res.status(400).json({ message: 'Email already subscribed' });
    }

    // Create new subscriber
    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      subscribedAt: new Date()
    });

    await subscriber.save();

    // Send welcome email
    try {
      await sendNewsletterConfirmation({ email, name: email.split('@')[0] });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if welcome email fails
    }

    res.status(201).json({ 
      message: 'Successfully subscribed to newsletter',
      subscriber: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt
      }
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ message: 'Error subscribing to newsletter' });
  }
});

// Get all subscribers (for admin purposes)
router.get('/list', async (req, res) => {
  try {
    const subscribers = await Subscriber.find()
      .sort({ subscribedAt: -1 })
      .select('-__v');
    res.status(200).json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await Subscriber.findOneAndDelete({ email: email.toLowerCase() });
    
    if (!result) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    res.status(200).json({ message: 'Successfully unsubscribed from newsletter' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Error unsubscribing from newsletter' });
  }
});

// Send newsletter to all subscribers
router.post('/send-newsletter', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Newsletter content is required' });
    }

    const subscribers = await Subscriber.find({});
    
    if (subscribers.length === 0) {
      return res.status(404).json({ message: 'No subscribers found' });
    }

    const emailPromises = subscribers.map(subscriber => 
      sendNewsletter({ 
        to: subscriber.email, 
        subject: 'Path Finder Newsletter', 
        content 
      })
    );

    await Promise.all(emailPromises);
    res.status(200).json({ 
      message: 'Newsletter sent to all subscribers',
      count: subscribers.length
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Error sending newsletter' });
  }
});

// Send new blog post notification to all subscribers
router.post('/notify-blog-post', async (req, res) => {
  try {
    const { title, excerpt, author, slug, url } = req.body;
    
    if (!title || !excerpt || !author || !slug) {
      return res.status(400).json({ message: 'Title, excerpt, author, and slug are required' });
    }

    // Get all subscribers
    const subscribers = await Subscriber.find({});
    
    if (subscribers.length === 0) {
      return res.status(404).json({ message: 'No subscribers found' });
    }

    // Create the blog post URL
    const blogPostUrl = url || `${process.env.FRONTEND_URL || 'https://factorbeam.com'}/blog/${slug}`;

    // Send notification to all subscribers
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const mailOptions = await sendNewBlogPostToSubscribers({
          title,
          excerpt,
          author,
          slug,
          url: blogPostUrl
        });
        
        // Update the 'to' field for each subscriber
        mailOptions.to = subscriber.email;
        
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        
        await transporter.sendMail(mailOptions);
        console.log(`Blog post notification sent to: ${subscriber.email}`);
      } catch (emailError) {
        console.error(`Error sending to ${subscriber.email}:`, emailError);
        // Continue with other subscribers even if one fails
      }
    });

    await Promise.allSettled(emailPromises);
    
    res.status(200).json({ 
      message: 'Blog post notification sent to all subscribers',
      count: subscribers.length
    });
  } catch (error) {
    console.error('Error sending blog post notifications:', error);
    res.status(500).json({ message: 'Error sending blog post notifications' });
  }
});

export default router; 