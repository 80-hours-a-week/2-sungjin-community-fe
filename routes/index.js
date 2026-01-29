const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const postsRoutes = require('./posts');
const viewsRoutes = require('./views');

// 메인 → 로그인 페이지로 리다이렉트
router.get('/', (req, res) => {
    res.redirect('/login');
});

// 기능별 라우터 연결
router.use('/', authRoutes);
router.use('/posts', postsRoutes);
router.use('/', viewsRoutes);

module.exports = router;