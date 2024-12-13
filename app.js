// Load environment variables from .env file
// npm install connect-redis redis express-session dotenv axios

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const redis = require('redis');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis').default; // Correct import
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Redis Configuration
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

// Create Redis Client
const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log(`Connected to Redis at ${redisHost}:${redisPort}`);
    } catch (err) {
        console.error('Error connecting to Redis:', err);
        process.exit(1);
    }
})();

// Set up session middleware
app.use(
    session({
        store: RedisStore.create({ client: redisClient }), // Use `.create()` method
        secret: process.env.SESSION_SECRET || 'your_secret_key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false } // Set secure: true in production with HTTPS
    })
);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.send('Hello, World! Redis is ready.');
});

app.post('/chat', async (req, res) => {
    const { sessionId, message } = req.body;

    const chatSessionKey = `chat:${sessionId || 'default-session'}`;

    try {
        // Retrieve chat history from Redis
        const history = JSON.parse(await redisClient.get(chatSessionKey) || '[]');

        // Send the user's message to Ollama's chat endpoint
        const response = await axios.post('http://localhost:11434/api/chat', {
            prompt: message,
            history
        });

        const reply = response.data.response || 'No response received';

        // Update chat history in Redis
        history.push({ role: 'user', content: message });
        history.push({ role: 'bot', content: reply });

        await redisClient.set(chatSessionKey, JSON.stringify(history));

        res.json({ reply, history });
    } catch (err) {
        console.error('Chat Error:', err);
        res.status(500).send('Error interacting with the chat API.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
