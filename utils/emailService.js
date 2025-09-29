import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send contact form email
export const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This email was sent from the Path Finder contact form.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Contact email sent successfully');
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw error;
  }
};

// Send newsletter subscription confirmation
export const sendNewsletterConfirmation = async ({ email, name }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Factor Beam Newsletter!',
      html: `
        <h2 style="color: #333;">Welcome to Factor Beam!</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for subscribing to our newsletter! You'll now receive the latest career insights, guidance, and tips delivered directly to your inbox.</p>
        <p>Stay tuned for:</p>
        <ul>
          <li>Career guidance articles</li>
          <li>Industry insights and trends</li>
          <li>Professional development tips</li>
          <li>Success stories and case studies</li>
        </ul>
        <p>Best regards,<br>The Factor Beam Team</p>
        <hr>
        <p style="color: #666; font-size: 12px;">You can unsubscribe at any time by clicking the unsubscribe link in our emails.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Newsletter confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending newsletter confirmation:', error);
    throw error;
  }
};

// Send newsletter to subscribers
export const sendNewsletter = async ({ to, subject, content }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Factor Beam Newsletter</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            ${content}
          </div>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This email was sent to you because you subscribed to the Factor Beam newsletter.<br>
            You can unsubscribe at any time by clicking the unsubscribe link below.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Newsletter sent successfully to:', to);
  } catch (error) {
    console.error('Error sending newsletter:', error);
    throw error;
  }
};

// Send admin notification for new blog post
export const sendBlogPostNotification = async ({ title, excerpt, author, slug, url }) => {
  try {
    // Create the blog post URL
    const blogPostUrl = url || `${process.env.FRONTEND_URL || 'https://factorbeam.com'}/blog/${slug}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: 'New Blog Post Published - Factor Beam',
      html: `
        <h2 style="color: #333;">New Blog Post Published - Factor Beam</h2>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Author:</strong> ${author}</p>
        <p><strong>Excerpt:</strong></p>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${excerpt}</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${blogPostUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Blog Post</a>
        </div>
        <p style="color: #666; font-size: 12px; word-break: break-all;">
          <strong>Direct Link:</strong> <a href="${blogPostUrl}">${blogPostUrl}</a>
        </p>
        <hr>
        <p style="color: #666; font-size: 12px;">This notification was sent automatically when a new blog post was published on Factor Beam.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Blog post notification sent successfully');
  } catch (error) {
    console.error('Error sending blog post notification:', error);
    throw error;
  }
};

// Send new blog post notification to all subscribers
export const sendNewBlogPostToSubscribers = async ({ title, excerpt, author, slug, url }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'subscribers', // This will be handled by the calling function
      subject: `New Blog Post: ${title}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">New Blog Post from Factor Beam!</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2563eb; margin-top: 0;">${title}</h3>
            <p style="color: #666; font-style: italic;">By ${author}</p>
            <p style="line-height: 1.6;">${excerpt}</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Read Full Article</a>
            </div>
          </div>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This email was sent to you because you subscribed to the Factor Beam newsletter.<br>
            You can unsubscribe at any time by clicking the unsubscribe link below.
          </p>
        </div>
      `
    };

    return mailOptions;
  } catch (error) {
    console.error('Error creating blog post notification:', error);
    throw error;
  }
}; 