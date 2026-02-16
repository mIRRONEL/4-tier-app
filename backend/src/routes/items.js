const express = require('express');
const { Op } = require('sequelize');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');

const { redisClient } = require('../config/redis');
const os = require('os');

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

        // Invalidate ALL paginated cache for this user
        const keys = await redisClient.keys(`items:${req.user.id}:*`);
        if (keys.length > 0) await redisClient.del(keys);

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Get My Items (Paginated)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const cacheKey = `items:${req.user.id}:p:${page}:l:${limit}`;

        // Try Cache
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            console.log(`[${os.hostname()}] Serving Page ${page} from Cache`);
            return res.json(JSON.parse(cachedResults));
        }

        // Fetch DB
        const { count, rows } = await Item.findAndCountAll({
            where: { UserId: req.user.id },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const result = {
            items: rows,
            total: count,
            page,
            pages: Math.ceil(count / limit)
        };

        // Set Cache (default: 1 hour)
        const ttlItems = parseInt(process.env.CACHE_TTL_ITEMS) || 3600;
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: ttlItems });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Search My Items (Paginated)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const cacheKey = `search:${req.user.id}:q:${q}:p:${page}:l:${limit}`;

        // Try Cache
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            console.log(`[${os.hostname()}] Serving Search "${q}" Page ${page} from Cache`);
            return res.json(JSON.parse(cachedResults));
        }

        const { count, rows } = await Item.findAndCountAll({
            where: {
                UserId: req.user.id,
                [Op.or]: [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ]
            },
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const result = {
            items: rows,
            total: count,
            page,
            pages: Math.ceil(count / limit)
        };

        // Cache (default: 5 minutes)
        const ttlSearch = parseInt(process.env.CACHE_TTL_SEARCH) || 300;
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: ttlSearch });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Delete Item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Item.findOne({ where: { id, UserId: req.user.id } });

        if (!item) {
            return res.status(404).json({ error: 'Item not found or unauthorized' });
        }

        await item.destroy();

        // Invalidate ALL paginated cache for this user
        const keys = await redisClient.keys(`items:${req.user.id}:*`);
        if (keys.length > 0) await redisClient.del(keys);

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router;
