const express = require('express');
const auth = require('../models/auth');
const router = express.Router();

// Registration
router.post('/register', (req, res) => {
    auth.register(req, res);
});

// Verify
router.get('/verify', (req, res) => {
    auth.verifyEmail(req, res);
});

// Login
router.post('/login', (req, res) => {
    auth.login(req, res);
});

module.exports = router;
