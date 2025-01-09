const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Make sure to adjust path
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Check if email is provided
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Check if the email already exists
        const existingUser = await new Promise((resolve, reject) => {
            User.findUserByEmail(email, (err, user) => {
                if (err) return reject(err);
                resolve(user);
            });
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to database
        User.createUser(email, hashedPassword, (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving user', error: err });
            }

            res.status(201).json({ message: 'User registered successfully', user });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error });
    }
});

// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find the user by email
        const user = await new Promise((resolve, reject) => {
            User.findUserByEmail(email, (err, user) => {
                if (err) return reject(err);
                resolve(user);
            });
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create JWT token
        const payload = {
            userId: user.id,
            email: user.email
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send the token back to the client
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error });
    }
});

// Middleware to check if the user is authenticated
const authenticate = (req, res, next) => {
    token = req.header('Authorization');
    token = token.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Store user data in the request object for later use
        next();
    } catch (error) {
        console.error(error)
        console.log(token)
        console.log(process.env.JWT_SECRET)
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Example protected route (only accessible if logged in)
router.get('/profile', authenticate, (req, res) => {
    const userEmail = req.user.email;  // Get the logged-in user's email from the JWT

    // Check if Instagram, TikTok, or YouTube accounts are linked
    const platforms = ['instagram', 'tiktok', 'youtube'];
    const linkedAccounts = {};

    // Check each platform
    let checksRemaining = platforms.length;
    platforms.forEach((platform) => {
        User.isAccountLinked(userEmail, platform, (err, isLinked) => {
            if (err) {
                return res.status(500).json({ message: 'Error checking linked accounts' });
            }

            // Set the platform link status
            linkedAccounts[platform] = isLinked;

            // Once all checks are done, send the response
            checksRemaining -= 1;
            if (checksRemaining === 0) {
                res.json({
                    email: userEmail,
                    linkedAccounts: linkedAccounts
                });
            }
        });
    });
});

router.get('/service/register', authenticate, (req, res) => {
    
})

module.exports = (db) => {
    // Set the DB if needed (optional)
    User.setDB(db);

    return router;
};
