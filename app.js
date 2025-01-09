const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const User = require('./models/User');  // Import User.js

dotenv.config();

const app = express();

// Initialize SQLite database connection
const db = new sqlite3.Database('./localdb.sqlite', (err) => {
    if (err) {
        console.error("Error opening database: ", err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Set the DB for the User model (must be done before interacting with the DB)
User.setDB(db);  // Pass the db instance to the User model

// Initialize the Users table (create if it doesn't exist)
User.initializeUserTable();  // Initialize table

app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api/', authRoutes(db));


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
