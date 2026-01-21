const express = require('express');
const { Op } = require('sequelize');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');

const { redisClient } = require('../config/redis');

const router = express.Router();

// All routes here are protected
router.use(authenticateToken);

// Create Item
router.post('/', async (req, res) => {
    try {
        const { title, description } = req.body;
        const item = await Item.create({
            title,
            description,
            UserId: req.user.id
        });

        // Invalidate user's item cache
        await redisClient.del(`items:${req.user.id}`);
        await redisClient.del(`search:${req.user.id}:*`); // Optional: clear search cache patterns if feasible, or let them expire

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Get My Items
router.get('/', async (req, res) => {
    try {
        const cacheKey = `items:${req.user.id}`;

        // Try Cache
        const cachedItems = await redisClient.get(cacheKey);
        if (cachedItems) {
            console.log('Serving Items from Cache');
            return res.json(JSON.parse(cachedItems));
        }

        // Fetch DB
        const items = await Item.findAll({ where: { UserId: req.user.id } });

        // Set Cache (1 hour)
        await redisClient.set(cacheKey, JSON.stringify(items), { EX: 3600 });

        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Search My Items
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const items = await Item.findAll({
            where: {
                UserId: req.user.id,
                [Op.or]: [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ]
            }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;
