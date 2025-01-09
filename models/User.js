const sqlite3 = require('sqlite3').verbose();

// Initialize database connection (passed from app.js)
let db;

// Function to set the DB instance
const setDB = (database) => {
    db = database;
};

// Function to create the users table if it doesn't exist
const initializeUserTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            instagram_token TEXT,
            tiktok_token TEXT,
            youtube_token TEXT
        )
    `;
    db.run(query, (err) => {
        if (err) {
            console.error("Error creating table: ", err.message);
        } else {
            console.log('Users table created or already exists.');
        }
    });
};

const saveDraft = (email, videoPath, title, description, callback) => {
    const query = `INSERT INTO drafts (email, videoPath, title, description) VALUES (?, ?, ?, ?)`;
    db.run(query, [email, videoPath, title, description], (err) => {
        callback(err);
    });
};

const getDraftsByEmail = (email, callback) => {
    const query = `SELECT * FROM drafts WHERE email = ? ORDER BY timestamp DESC`;
    db.all(query, [email], (err, rows) => {
        if (err) {
            return callback(err);
        }
        callback(null, rows);
    });
};

const getTokens = (email, callback) => {
    const query = `SELECT tiktokToken, instagramToken, youtubeToken FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
        if (err) {
            return callback(err);
        }
        callback(null, row);
    });
};

// Function to create a new user
const createUser = (email, password, callback) => {
    const query = `INSERT INTO users (email, password) VALUES (?, ?)`;
    db.run(query, [email, password], function (err) {
        if (err) {
            return callback(err);
        }
        callback(null, { id: this.lastID, email });
    });
};

// Function to find a user by email
const findUserByEmail = (email, callback) => {
    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
        if (err) {
            return callback(err);
        }
        callback(null, row);
    });
};

// Function to link a platform (Instagram, TikTok, YouTube) to the user's account
const linkAccount = (email, platform, token, callback) => {
    const column = `${platform}_token`;
    const query = `UPDATE users SET ${column} = ? WHERE email = ?`;
    db.run(query, [token, email], (err) => {
        if (err) {
            return callback(err);
        }
        callback(null);
    });
};

// Function to check if a platform is linked
const isAccountLinked = (email, platform, callback) => {
    const column = `${platform}_token`;
    const query = `SELECT ${column} FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
        if (err) {
            console.error(err)
            return callback(err);
        }
        callback(null, row && row[column] != null);  // Returns true if token is present
    });
};


// Export functions
module.exports = {
    setDB,
    getTokens,
    initializeUserTable,
    createUser,
    findUserByEmail,
    linkAccount,
    isAccountLinked,
    saveDraft,
    getDraftsByEmail
};
