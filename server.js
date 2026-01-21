const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:8000';


app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res, next) => {
    res.locals.apiUrl = API_URL;
    next();
});


// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 회원가입
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

// 로그인
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 게시글 목록
app.get('/posts', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'posts.html'));
});

// 게시글 작성
app.get('/posts/write', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'write.html'));
});

// 게시글 상세
app.get('/posts/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'post-detail.html'));
});

// 게시글 수정
app.get('/posts/:id/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'edit.html'));
});

// 프로필
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// 프로필 수정
app.get('/profile/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile-edit.html'));
});

// 이용약관
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});

// 개인정보처리방침
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

// ==================== 에러 처리 ====================

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// ==================== 서버 시작 ====================

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🎭 아무 말 대잔치 - 프론트엔드 서버');
    console.log('='.repeat(50));
    console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📡 백엔드 API: ${API_URL}`);
    console.log(`📁 정적 파일: ${path.join(__dirname, 'public')}`);
    console.log(`📄 HTML 파일: ${path.join(__dirname, 'views')}`);
    console.log('='.repeat(50));
});