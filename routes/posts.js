const express = require('express');
const router = express.Router();
const { sendView } = require('../helpers/view');

// GET /posts - 게시글 목록
router.get('/', (req, res) => {
    sendView(res, 'posts');
});

// GET /posts/write - 작성 페이지
router.get('/write', (req, res) => {
    sendView(res, 'write');
});

// GET /posts/:id - 상세보기
router.get('/:id', (req, res) => {
    sendView(res, 'post-detail');
});

// GET /posts/:id/edit - 수정 페이지
router.get('/:id/edit', (req, res) => {
    sendView(res, 'post-edit');
});

module.exports = router;