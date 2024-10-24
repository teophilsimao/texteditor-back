// Auth route

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

// Request password reset
router.post('/request-reset-password', (req, res) => {
    auth.requestResetPassword(req, res)
});

//Reset Password
router.post('/reset-password', (req, res) => {
    auth.resetPassword(req, res)
});

module.exports = router;
