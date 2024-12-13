// app.js
const express = require('express');
const bodyParser = require('body-parser');
const redis = require('./redisClient');
const path = require('path');
const axios = require('axios'); // For interacting with Ollama

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index'); // Renders the main chat interface
});

app.post('/chat', async (req, res) => {
    const { sessionId, message } = req.body;

    // Ensure session ID is set
    const chatSessionKey = `chat:${sessionId}`;

    // Call Ollama API
    try {
        const response = await axios.post('http://localhost:11434', {
            prompt: message,
        });

        const reply = response.data?.response || "Error communicating with Ollama";

        // Save message and reply to Redis
        const history = JSON.parse(await redis.get(chatSessionKey) || '[]');
        history.push({ role: 'user', content: message });
        history.push({ role: 'bot', content: reply });

        await redis.set(chatSessionKey, JSON.stringify(history));

        res.json({ reply, history });
    } catch (error) {
        console.error('Error interacting with Ollama:', error);
        res.status(500).send('Error interacting with Ollama');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
