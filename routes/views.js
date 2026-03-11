const express = require('express');
const router = express.Router();
const { sendView } = require('../helpers/view');

// 프로필 관리
router.get('/profile/edit', (req, res) => {
    sendView(res, 'profile-edit');
});

router.get('/password/change', (req, res) => {
    sendView(res, 'password-change');
});

router.get('/messages', (req, res) => {
    sendView(res, 'messages');
});

// 정책 페이지
router.get('/terms', (req, res) => {
    sendView(res, 'terms');
});

router.get('/privacy', (req, res) => {
    sendView(res, 'privacy');
});

module.exports = router;
