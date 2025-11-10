const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            message: 'Authentication required. No token provided.' 
        });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; // Contains { userId, email, etc }
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(403).json({ 
            message: 'Invalid or expired token',
            error: error.message
        });
    }
};

module.exports = authenticateToken;
