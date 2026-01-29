const express = require('express');
const router = express.Router();
const { sendView } = require('../helpers/view');

// GET /login
router.get('/login', (req, res) => {
    sendView(res, 'login');
});

// GET /signup
router.get('/signup', (req, res) => {
    sendView(res, 'signup');
});

module.exports = router;