import express from 'express';
import Subscriber from '../models/Subscriber.js';
import { sendNewsletterConfirmation, sendNewsletter } from '../utils/emailService.js';

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

export default router; 