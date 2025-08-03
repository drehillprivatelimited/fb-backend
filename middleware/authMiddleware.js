const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // In production, you should use JWT verification here
    // For now, we'll just check if the token exists
    // You might want to add more sophisticated token validation
    const decodedToken = Buffer.from(token, 'base64').toString();
    const [email, timestamp] = decodedToken.split('-');
    
    // Check if token is expired (24 hours)
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ message: 'Session expired' });
    }

    // Add email to request for future use
    req.adminEmail = email;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export { verifyAdmin }; 