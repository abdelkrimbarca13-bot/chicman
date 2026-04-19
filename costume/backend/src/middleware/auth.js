const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No auth header');
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      console.log('Token is empty or invalid string:', token);
      return res.status(401).json({ message: 'Authentication failed: Invalid token format' });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = { 
      userId: decodedToken.userId, 
      role: decodedToken.role,
      username: decodedToken.username 
    };
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({ message: 'Authentication failed: ' + error.message });
  }
};
