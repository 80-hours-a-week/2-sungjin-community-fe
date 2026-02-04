# 🎭 아무 말 대잔치 (Community Platform)

> **누구나 자유롭게 소통할 수 있는 커뮤니티 플랫폼**  
> 사용자의 경험을 최우선으로 고려한 직관적이고 깔끔한 UI/UX를 제공합니다.


## 📖 프로젝트 소개

**'아무 말 대잔치'**는 게시글 작성, 수정, 삭제, 댓글 및 좋아요 기능 등 커뮤니티의 핵심 기능을 충실히 구현한 웹 애플리케이션입니다.  
RESTful API 기반의 백엔드와 연동되어 데이터의 무결성을 보장하며, 프론트엔드는 Vanilla JavaScript를 사용하여 가볍고 빠른 성능을 자랑합니다.

### 🎯 개발 목표
- 복잡한 프레임워크 없이 **Vanilla JS**만으로 SPA에 준하는 부드러운 사용자 경험 구현
- **REST API**와의 완벽한 연동 및 예외 처리
- 모바일과 데스크톱 모두를 지원하는 **반응형 디자인**
- 직관적인 사용자 인터페이스와 마이크로 인터랙션

---

## 🛠 기술 스택 (Tech Stack)

### Frontend
- **Language**: JavaScript (ES6+), HTML5, CSS3
- **Server**: Node.js, Express.js (뷰 렌더링 및 정적 파일 서빙)
- **Networking**: Fetch API
- **Styling**: Vanilla CSS (Flexbox/Grid layout, Responsive design)

### Backend (Integrated)
- **API Server**: Python FastAPI
- **Database**: MySQL / SQLite (Development)

---

## ✨ 주요 기능 (Key Features)

### 1. 👤 회원 관리 (User System)
- **회원가입**: 이메일 중복 확인, 비밀번호 유효성 검사, 프로필 이미지 업로드
- **로그인/로그아웃**: 세션 기반 인증 관리
- **마이페이지**: 프로필 수정 (닉네임, 이미지), 비밀번호 변경, 회원 탈퇴

### 2. 📝 게시글 관리 (Post Management)
- **게시글 작성/수정/삭제**: 이미지 업로드 지원
- **게시글 목록**: 페이지네이션(Pagination) 또는 더보기 기능을 통한 효율적인 데이터 로딩
- **상세 보기**: 조회수 증가 및 상세 내용 확인

### 3. 💬 소통 및 반응 (Interaction)
- **댓글 시스템**: 게시글에 대한 댓글 작성, 수정, 삭제
- **좋아요(Like)**: 게시글에 대한 즉각적인 반응 기능

### 4. 🎨 UI/UX
- **반응형 레이아웃**: 모든 디바이스에서 최적화된 화면 제공
- **커스텀 모달(Modal)**: 브라우저 기본 알림 대신 세련된 모달창 사용
- **스켈레톤 로딩(Skeleton Loading)**: 데이터 로딩 시 시각적 피드백 제공

---

## 📂 프로젝트 구조 (Project Structure)

```bash
2-sungjin-community-fe/
├── public/             # 정적 파일 (Static Assets)
│   ├── css/            # 스타일시트 (.css)
│   ├── js/             # 클라이언트 스크립트 (.js)
│   └── images/         # 이미지 리소스
├── routes/             # Express 라우터 (Page Routing)
├── views/              # HTML 뷰 템플릿
├── helpers/            # 유틸리티 함수
├── server.js           # Frontend 서버 진입점
├── package.json        # 의존성 및 스크립트 관리
└── README.md           # 프로젝트 문서
```

---

## 🚀 시작 가이드 (Getting Started)

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계가 필요합니다.

### 1. 요구 사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v14.0.0 이상)
- [Python](https://www.python.org/) (백엔드 실행용, 3.8 이상)

### 2. 설치 및 실행 (Installation)

#### Frontend
```bash

# 이동
cd 2-sungjin-community-fe

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
# PORT=3001
# API_URL=http://localhost:8000

# 개발 모드 실행
npm run dev
```

#### Backend (별도 실행 필요)
> 백엔드 서버가 8000번 포트에서 실행 중이어야 합니다.
> `start_backend.bat` 파일을 사용하여 윈도우에서 간편하게 실행할 수 있습니다.

```bash
# 백엔드 실행 스크립트 (Windows)
./start_backend.bat
```

### 3. 브라우저 확인
브라우저를 열고 `http://localhost:3001` 으로 접속하세요.

---

## 👨‍💻 개발자 정보 (Author)

**안성진 (Sungjin An)**

- 📧 Email: sungjin9288@gmail.com
- 🐙 GitHub: [sungjin9288](https://github.com/sungjin9288)

Copyright © 2026 Sungjin An. All rights reserved.
