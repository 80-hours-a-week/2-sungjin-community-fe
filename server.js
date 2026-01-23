require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:8000';

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 라우팅 - 메인 페이지를 로그인으로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/profile/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile-edit.html'));
});

app.get('/password/change', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'password-change.html'));
});

app.get('/posts', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'posts.html'));
});

app.get('/posts/write', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'write.html'));
});

app.get('/posts/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'post-detail.html'));
});

app.get('/posts/:id/edit', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'edit.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'privacy.html'));
});

// 404 페이지
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log('==================================================');
    console.log('🎭 아무 말 대잔치 - 프론트엔드 서버');
    console.log('==================================================');
    console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📡 백엔드 API: ${API_URL}`);
    console.log(`📁 정적 파일: ${path.join(__dirname, 'public')}`);
    console.log(`📄 HTML 파일: ${path.join(__dirname, 'views')}`);
    console.log('==================================================');
});