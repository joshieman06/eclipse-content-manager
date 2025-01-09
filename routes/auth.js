const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const User = require('../models/User');  // Make sure to adjust path
const dotenv = require('dotenv');
const upload = require('../middleware/upload');

dotenv.config();

const router = express.Router();

// Register a new user
router.post('/auth/register', async (req, res) => {
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
router.post('/auth/login', async (req, res) => {
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

router.post('/service/link', authenticate, (req, res) => {
    const userEmail = req.user.email;
    const { platform, token } = req.body;

    if (!platform || !token) {
        return res.status(400).json({ message: 'Platform and token are required' });
    }

    User.linkAccount(userEmail, platform, token, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error linking account' });
        }

        res.status(200).json({ message: `Linked ${platform} account successfully` });
    });
});

// Example endpoint to retrieve tokens for a user
router.get('/tokens', authenticate, async (req, res) => {
    const userEmail = req.user.email;
    try {
        const tokens = await User.getTokens(userEmail); // Retrieves tokens from the database
        res.status(200).json(tokens);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving tokens', error: error.message });
    }
});


// router.post('/publish', authenticate, async (req, res) => {
//     const userEmail = req.user.email;
//     const { url, tiktok, instagram, youtube } = req.body;

//     if (!(tiktok || instagram || youtube)) {
//         return res.status(400).json({ message: 'At least one platform must be selected' });
//     }

//     const results = {};
//     const errors = {};

//     // Function to handle each platform publishing
//     const publish = async (platform, publishFunction) => {
//         try {
//             await publishFunction(userEmail, url);
//             results[platform] = 'Success';
//         } catch (error) {
//             errors[platform] = `Error publishing to ${platform}: ${error.message}`;
//         }
//     };

//     // Array of publishing tasks
//     const tasks = [];
//     if (tiktok) tasks.push(publish('TikTok', User.publishToTikTok));
//     if (instagram) tasks.push(publish('Instagram', User.publishToInstagram));
//     if (youtube) tasks.push(publish('YouTube', User.publishToYouTube));

//     // Execute all tasks concurrently
//     await Promise.all(tasks);

//     // Return the status report
//     res.status(200).json({ results, errors });
// });

router.post('/draft/save-draft', authenticate, upload.single('video'), (req, res) => {
    const userEmail = req.user.email;
    const { title, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Video file is required' });
    }

    const videoPath = req.file.path;

    // Save draft details to the database (video path, title, description, user email)
    User.saveDraft(userEmail, videoPath, title, description, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error saving draft', error: err.message });
        }
        res.status(200).json({ message: 'Draft saved successfully', draft: { videoPath, title, description } });
    });
});

// Function to save draft details in the database

router.get('draft/drafts', authenticate, (req, res) => {
    const userEmail = req.user.email;

    User.getDraftsByEmail(userEmail, (err, drafts) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving drafts', error: err.message });
        }
        
        res.status(200).json({ drafts });
    });
});

module.exports = (db) => {
    User.setDB(db);
    return router;
};
