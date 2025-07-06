const express = require('express');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
let dbInitialized = false;

async function ensureDbInit() {
    if (!dbInitialized) {
        try {
            await db.init();
            dbInitialized = true;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }
}

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes

// Get all characters
app.get('/api/characters', async (req, res) => {
    try {
        console.log('API /characters called');
        await ensureDbInit();
        const characters = await db.getAllCharacters();
        console.log('Characters retrieved:', characters.length);
        res.json(characters);
    } catch (error) {
        console.error('Error fetching characters:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch characters',
            details: error.message 
        });
    }
});

// Get character by key
app.get('/api/characters/:key', async (req, res) => {
    try {
        const character = await db.getCharacterByKey(req.params.key);
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        res.json(character);
    } catch (error) {
        console.error('Error fetching character:', error);
        res.status(500).json({ error: 'Failed to fetch character' });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const user = await db.createUser(username);
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get user by ID
app.get('/api/users/:userId', async (req, res) => {
    try {
        const user = await db.getUserById(parseInt(req.params.userId));
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Get user by username
app.get('/api/users/username/:username', async (req, res) => {
    try {
        const user = await db.getUserByUsername(req.params.username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Save score
app.post('/api/scores', async (req, res) => {
    try {
        const { userId, characterKey, time, stage } = req.body;
        if (!userId || !characterKey || !time) {
            return res.status(400).json({ error: 'userId, characterKey, and time are required' });
        }
        
        const score = await db.saveScore(userId, characterKey, time, stage || 1);
        res.status(201).json(score);
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// Get leaderboard
app.get('/api/scores', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const scores = await db.getLeaderboard(limit);
        res.json(scores);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get user scores
app.get('/api/users/:userId/scores', async (req, res) => {
    try {
        const scores = await db.getUserScores(parseInt(req.params.userId));
        res.json(scores);
    } catch (error) {
        console.error('Error fetching user scores:', error);
        res.status(500).json({ error: 'Failed to fetch user scores' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// For Vercel serverless deployment
module.exports = app;

// For local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}