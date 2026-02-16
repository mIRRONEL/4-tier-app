const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/database');
const { connectRedis, redisClient } = require('./config/redis');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const seedAdminUser = require('./seeders/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));
app.use(express.json());

// Initialize connections
// Initialize connections moved to startServer

app.use('/auth', authRoutes);
app.use('/items', itemRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Create a message (Persist to DB, invalidate cache)
app.post('/messages', async (req, res) => {
    try {
        const { content } = req.body;
        const message = await Message.create({ content });

        // Invalidate cache
        await redisClient.del('all_messages');

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create message' });
    }
});

// Get all messages (Try Cache -> Fallback to DB -> Set Cache)
app.get('/messages', async (req, res) => {
    console.log('GET /messages request received');
    try {
        // Check cache first
        const cachedMessages = await redisClient.get('all_messages');
        if (cachedMessages) {
            console.log('Serving from Cache');
            return res.json(JSON.parse(cachedMessages));
        }

        // Fetch from DB
        const messages = await Message.findAll();
        console.log('Serving from Database');

        // Set cache (expire in 1 hour)
        await redisClient.set('all_messages', JSON.stringify(messages), {
            EX: 3600
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

const startServer = async () => {
    try {
        await connectDB();
        await seedAdminUser();
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
