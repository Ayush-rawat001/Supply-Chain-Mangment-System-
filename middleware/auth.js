const User = require('../models/User');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Get user from database to check role
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Add user info to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Middleware to check if user has admin role
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
};

// Middleware to check if user has specific role
const requireRole = (role) => {
    return async (req, res, next) => {
        try {
            if (!req.session.userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (user.role !== role && user.role !== 'admin') {
                return res.status(403).json({ error: `${role} access required` });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({ error: 'Authorization failed' });
        }
    };
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireRole
}; 