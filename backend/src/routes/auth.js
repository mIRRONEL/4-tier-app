const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { redisClient } = require('../config/redis');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, password: hashedPassword });
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user', details: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) return res.status(400).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

        const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Store refresh token in Redis (7 days)
        await redisClient.set(`refresh_token:${user.id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

        res.json({ accessToken, refreshToken, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, JWT_SECRET);
        } catch (err) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Check if it matches stored token in Redis
        const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
        if (storedToken !== refreshToken) {
            return res.status(403).json({ error: 'Token revoked or expired' });
        }

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(403).json({ error: 'User not found' });

        const newAccessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await redisClient.del(`refresh_token:${req.user.id}`);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

module.exports = router;
