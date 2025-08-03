import express from 'express';
import { sendOTP, verifyOTP } from '../services/authService.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      return res.status(500).json({ 
        message: 'Admin email not configured. Please set ADMIN_EMAIL in .env file' 
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        message: 'Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in .env file' 
      });
    }

    await sendOTP(adminEmail);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error in send-otp route:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
  try {
    const { otp } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return res.status(500).json({ 
        message: 'Admin email not configured. Please set ADMIN_EMAIL in .env file' 
      });
    }

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const isValid = verifyOTP(adminEmail, otp);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Generate a session token
    const sessionToken = Buffer.from(`${adminEmail}-${Date.now()}`).toString('base64');
    
    res.json({ 
      message: 'OTP verified successfully',
      token: sessionToken
    });
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to verify OTP',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 