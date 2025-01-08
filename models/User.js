const sqlite3 = require('sqlite3').verbose();

// Initialize database connection (passed from app.js)
let db;

module.exports.setDB = (database) => {
    db = database;
};

// Function to create a user
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

// Create the users table if not exists (Call this once during app startup)
const initializeUserTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
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

initializeUserTable();

module.exports = {
    createUser,
    findUserByEmail
};
