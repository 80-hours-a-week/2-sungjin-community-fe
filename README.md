
# 🎭 아무 말 대잔치 - 커뮤니티 프론트엔드

> **누구나 자유롭게 소통할 수 있는 커뮤니티 플랫폼** (Web Client)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![HTML5](https://img.shields.io/badge/HTML5-Semantic-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-Flexbox%2FGrid-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

---

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행](#-설치-및-실행)
- [UI/UX 디자인](#-uiux-디자인)
- [실무 적용 사항](#-실무-적용-사항)
- [학습 포인트](#-학습-포인트)
- [라이선스](#-라이선스)

---

## 🎯 프로젝트 소개

**'아무 말 대잔치'**는 게시글 작성, 수정, 삭제, 댓글 및 좋아요 기능 등 커뮤니티의 핵심 기능을 충실히 구현한 웹 애플리케이션입니다.
백엔드 API 서버와 연동하여 동작하며, 프레임워크에 의존하지 않는 **순수 프로그래밍 실력(Vanilla JS)**을 강조한 프로젝트입니다.

### 프로젝트 목표
- **Vanilla JS**만으로 SPA(Single Page Application)에 준하는 부드러운 사용자 경험 구현
- **RESTful API**와의 완벽한 연동 및 예외 처리
- 모바일과 데스크톱 모두를 지원하는 **반응형 디자인**
- 직관적인 사용자 인터페이스와 마이크로 인터랙션

---

## ✨ 주요 기능

### 👤 회원 관리 (User System)
- **회원가입**: 실시간 이메일 중복 확인, 비밀번호 보안 정책 검증
- **로그인/로그아웃**: 세션/쿠키 기반의 안전한 인증 처리
- **마이페이지**: 프로필 이미지 업로드(미리보기), 닉네임 수정, 비밀번호 변경, 회원 탈퇴

### 📝 게시글 관리 (Post Management)
- **게시글 CRUD**: 이미지 업로드를 포함한 게시글 작성, 수정, 삭제
- **효율적 데이터 로딩**: 페이지네이션(Pagination)을 통한 데이터 최적화
- **상세 보기**: 조회수 증가 및 상세 내용 확인

### 💬 소통 및 반응 (Interaction)
- **댓글 시스템**: 게시글에 대한 댓글 작성, 수정, 삭제
- **좋아요(Like)**: 즉각적인 피드백을 위한 좋아요 토글 기능

### 🎨 UI/UX
- **반응형 레이아웃**: Flexbox/Grid를 활용하여 모든 디바이스 최적화
- **커스텀 모달(Modal)**: OS 기본 알림을 대체하는 세련된 UI 모달
- **사용자 피드백**: 로딩 스피너, 토스트 메시지, 입력 폼 유효성 실시간 피드백

---

## 🛠️ 기술 스택

### Frontend Core
- **JavaScript (ES6+)**: `async/await`, `module pattern`, `DOM manipulation`
- **HTML5**: 시맨틱 태그 활용, 접근성 고려
- **CSS3**: Variable 활용, Media Queries, Animation

### Frontend Server
- **Node.js Environment**
- **Express.js**: 뷰 템플릿 렌더링 및 정적 리소스 서빙
- **Middleware**: 환경 변수 주입, 라우팅 처리

### Development & Tools
- **Fetch API**: 비동기 데이터 통신
- **Git**: 버전 관리 및 협업
- **VS Code**: 개발 환경

---

## � 프로젝트 구조

```bash
2-sungjin-community-fe/
├── public/                 # 정적 리소스
│   ├── css/                # 스타일시트 (common, auth, posts 등 모듈화)
│   ├── js/                 # 클라이언트 로직
│   │   ├── auth/           # 인증 관련 (login, signup)
│   │   ├── posts/          # 게시글 관련 (list, detail, write)
│   │   ├── api.js          # API 통신 모듈 (Fetch Wrapper)
│   │   └── utils.js        # 공통 유틸리티
│   └── images/             # 이미지 에셋
│
├── routes/                 # Express 라우팅
│   ├── index.js            # 메인 라우터
│   ├── posts.js            # 게시글 관련 라우터
│   └── auth.js             # 인증 관련 라우터
│
├── views/                  # HTML 뷰 템플릿
│   ├── index.html          # 메인 페이지
│   ├── posts.html          # 게시글 목록
│   ├── post-detail.html    # 상세 보기
│   └── ...
│
├── server.js               # Frontend 서버 진입점
├── .env                    # 환경 설정
└── README.md               # 프로젝트 문서
```

---

## 🚀 설치 및 실행

### 1. 전제 조건 (Prerequisites)
- [Node.js](https://nodejs.org/) (v14.0.0 이상)
- 백엔드 서버가 8000번 포트에서 실행 중이어야 합니다.

### 2. 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/sungjin9288/2-sungjin-community-fe.git
cd 2-sungjin-community-fe
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성합니다.

```ini
PORT=3001
API_URL=http://localhost:8000
FILE_UPLOAD_API_URL=
```

### 4. 실행

```bash
# 개발 모드 (Nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

### 5. 확인
브라우저에서 `http://localhost:3001` 접속

### 6. 백엔드 연동 스모크 테스트

```bash
npm run test:integration
```

- `verify_api.js`는 테스트용 사용자를 자동 생성하고 JWT 기반으로 회원/게시글/댓글/좋아요 흐름을 검증합니다.
- 기본 백엔드 주소는 `http://127.0.0.1:8000`이며, 필요 시 `API_URL` 환경 변수를 사용합니다.

```bash
FILE_UPLOAD_API_URL=https://{api-id}.execute-api.{region}.amazonaws.com npm run test:upload
```

- `verify_upload_gateway.js`는 Lambda + API Gateway 기반 S3 업로드 경로를 검증합니다.

### 7. AWS 빅뱅 배포 자료

- Terraform: `infra/aws-bigbang`
- 배포 가이드: `infra/aws-bigbang/README.md`
- QA 체크리스트: `docs/aws-bigbang-qa.md`
- 작업자 실행 문서: `docs/aws-bigbang-owner-runbook.md`

### 8. Docker 미니퀘스트 자료

- 실행 가이드: `docs/docker-miniquest-runbook.md`
- FE/BE 동시 실행: `docker-compose.yml`
- EC2 배포용 compose: `docker-compose.deploy.yml`
- 이미지 푸시 스크립트: `scripts/docker-push.sh`
- EC2 compose 배포 스크립트: `scripts/ec2-compose-deploy.sh`

---

## 💼 실무 적용 사항 (Best Practices)

### 1. 모듈화 및 재사용성
- **API 래퍼(Wrapper) 구현**: `api.js`에 `fetch` 로직을 캡슐화하여 중복 코드를 제거하고, 에러 처리를 일원화했습니다.
- **설정 주입 패턴**: `server.js`에서 환경 변수를 읽어 클라이언트(`window.ENV_CONFIG`)에 안전하게 주입하는 패턴을 사용했습니다.

### 2. 상태 관리 및 보안
- **상태 유효성 검사**: 회원가입 폼 등에서 실시간 유효성 검사(Debounce 적용)로 사용자 경험을 개선했습니다.
- **보안 고려**: `innerHTML` 사용을 지양하고 `textContent`를 사용하여 XSS 공격 가능성을 최소화했습니다.

### 3. 비동기 처리
- **Async/Await**: 콜백 지옥(Callback Hell)을 방지하고 코드 가독성을 높였습니다.
- **낙관적 UI 업데이트**: 좋아요 기능 등에서 서버 응답을 기다리지 않고 UI를 먼저 갱신하여 반응 속도를 높였습니다.

---

## � 학습 포인트

### Frontend Development
- ✅ **DOM 조작의 이해**: 리액트 같은 라이브러리 없이 직접 DOM을 제어하며 브라우저 렌더링 원리를 익혔습니다.
- ✅ **이벤트 위임(Event Delegation)**: 동적으로 생성되는 요소들의 이벤트를 효율적으로 관리하는 방법을 학습했습니다.
- ✅ **SPA 흉내내기**: 브라우저 히스토리 API와 동적 렌더링을 통해 SPA와 유사한 사용자 경험을 구현했습니다.

### Client-Server Communication
- ✅ **HTTP 통신**: REST API의 Method(GET, POST, PUT, DELETE)와 Status Code에 따른 적절한 처리를 구현했습니다.
- ✅ **CORS & Network**: 프론트엔드와 백엔드 분리 환경에서의 통신 문제(CORS)와 해결 방법을 이해했습니다.

---

## 📜 라이선스
Copyright © 2026 Sungjin An. All rights reserved.
