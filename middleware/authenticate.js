const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const express = require('express');

dotenv.config();

const authenticate = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required' });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Store user data in the request object for later use
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authenticate;
