require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;
const API_URL = process.env.API_URL || 'http://localhost:8000';
const FILE_UPLOAD_API_URL = process.env.FILE_UPLOAD_API_URL || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 환경변수를 JavaScript로 제공 (JSON.stringify로 XSS/파싱 오류 방어)
app.get('/config.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    const config = {
        API_URL,
        FILE_UPLOAD_API_URL,
        NODE_ENV,
        IS_DEV: NODE_ENV === 'development',
    };
    res.send(`window.ENV_CONFIG = ${JSON.stringify(config)};`);
});

// Blue/Green 배포 시 L7 health check 용도
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'frontend' });
});

// 라우팅
app.use('/', routes);

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
    console.log(`🖼️ 파일 업로드 API: ${FILE_UPLOAD_API_URL || '(disabled)'}`);
    console.log(`🌍 환경: ${NODE_ENV}`);
    console.log('==================================================');
});
