const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('./redisClient');
const path = require('path');

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
    res.render('index'); // Renders the chat interface
});

// Chat API Endpoint
app.post('/chat', async (req, res) => {
    const { sessionId, message } = req.body;

    // Use a default session ID if not provided
    const chatSessionKey = `chat:${sessionId || 'default-session'}`;

    try {
        // Send the user's message to Ollama's chat endpoint
        const response = await axios.post('http://localhost:11434/api/chat', {
            prompt: message,
            history: JSON.parse(await redis.get(chatSessionKey) || '[]'), // Include chat history
        });

        const reply = response.data.response || 'No response received';

        // Update the chat history
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
