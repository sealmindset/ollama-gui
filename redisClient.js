const { createClient } = require('redis');

const redisClient = createClient({
    url: 'redis://127.0.0.1:6379', // Update the URL if your Redis runs on a non-standard port
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

module.exports = redisClient;
