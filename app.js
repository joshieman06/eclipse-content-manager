const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const db = new sqlite3.Database('./localdb.sqlite', (err) => {
    if (err) {
        console.error("Error opening database: ", err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes(db));  // Pass db to routes

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
