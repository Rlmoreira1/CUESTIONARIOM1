import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { setupDatabase } from './database.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(bodyParser.json());

let db;

// Initialize Database
setupDatabase().then(database => {
    db = database;
    console.log('Database connected');
});

// Check if user has already taken the quiz
app.post('/api/check-access', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await db.get('SELECT * FROM evaluations WHERE email = ?', [email]);
        if (result) {
            return res.status(403).json({ message: 'Ya has realizado esta evaluación anteriormente.' });
        }
        res.status(200).json({ allowed: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save quiz results
app.post('/api/save-result', async (req, res) => {
    const { firstName, lastName, email, score, total, percentage } = req.body;
    try {
        await db.run(
            `INSERT INTO evaluations (firstName, lastName, email, score, total, percentage) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, email, score, total, percentage]
        );
        res.status(201).json({ success: true });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(403).json({ message: 'Ya has realizado esta evaluación.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all results
app.get('/api/admin/results', async (req, res) => {
    const password = req.headers['x-admin-password'];
    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    try {
        const results = await db.all('SELECT * FROM evaluations ORDER BY timestamp DESC');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
