const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            // console.log("Received AuthHeader:", authHeader);
            token = authHeader.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-passwordHash');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const faculty = (req, res, next) => {
    if (req.user && req.user.roles && req.user.roles.includes('faculty')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as faculty' });
    }
};

module.exports = { protect, faculty };
