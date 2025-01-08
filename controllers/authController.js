const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User
exports.registerUser = (req, res) => {
    const { email, password } = req.body;

    User.findUserByEmail(email, (err, user) => {
        if (user) return res.status(400).json({ message: 'User already exists' });

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) return res.status(500).json({ message: 'Server error' });

            User.createUser(email, hashedPassword, (err, newUser) => {
                if (err) return res.status(500).json({ message: 'Error creating user' });
                res.status(201).json({ message: 'User registered successfully' });
            });
        });
    });
};

// Login User
exports.loginUser = (req, res) => {
    const { email, password } = req.body;

    User.findUserByEmail(email, (err, user) => {
        if (!user) return res.status(404).json({ message: 'User not found' });

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({ token });
        });
    });
};
