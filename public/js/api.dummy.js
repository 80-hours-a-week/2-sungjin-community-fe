/**
 * 더미 API 모듈 (개발 전용)
 * 
 * 사용법:
 * HTML에서 api.js 대신 api.dummy.js 로드
 * 
 * ⚠️ 프로덕션에서는 절대 사용 금지
 */

const DUMMY_API_URL = 'https://jsonplaceholder.typicode.com';

console.warn('⚠️ DUMMY API 사용 중');
console.warn('실제 백엔드 연동 시 HTML에서 api.dummy.js → api.js로 교체하세요.');

// ============================================================
// 더미 헬퍼
// ============================================================

// 네트워크 지연 시뮬레이션
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// 더미 사용자 생성
const createDummyUser = (id) => ({
    id,
    email: `user${id}@example.com`,
    nickname: `사용자${id}`,
    profile_image_url: `https://i.pravatar.cc/150?img=${id}`
});

// ============================================================
// 인증 API (더미)
// ============================================================

async function signup(email, password, nickname) {
    await delay(500);
    console.log('[DUMMY] 회원가입:', { email, nickname });
    return {
        message: '회원가입 성공 (더미)',
        user: createDummyUser(Math.floor(Math.random() * 100))
    };
}

async function login(email, password) {
    await delay(500);
    console.log('[DUMMY] 로그인:', { email });
    return {
        message: '로그인 성공 (더미)',
        token: 'dummy-token-' + Date.now(),
        user: createDummyUser(1)
    };
}

async function logout() {
    await delay(300);
    console.log('[DUMMY] 로그아웃');
    return { message: '로그아웃 성공 (더미)' };
}

async function getMe() {
    await delay(300);
    return createDummyUser(1);
}

// ============================================================
// 게시글 API (더미)
// ============================================================

async function getPosts(page = 1, limit = 10) {
    await delay(400);
    const response = await fetch(`${DUMMY_API_URL}/posts?_page=${page}&_limit=${limit}`);
    const posts = await response.json();
    
    return {
        posts: posts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.body,
            author: createDummyUser(post.userId),
            likes_count: Math.floor(Math.random() * 50),
            comments_count: Math.floor(Math.random() * 20),
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            image_url: null
        })),
        total: 100,
        page,
        limit
    };
}

async function getPost(postId) {
    await delay(400);
    const response = await fetch(`${DUMMY_API_URL}/posts/${postId}`);
    const post = await response.json();
    
    return {
        id: post.id,
        title: post.title,
        content: post.body,
        author: createDummyUser(post.userId),
        likes_count: Math.floor(Math.random() * 50),
        comments_count: Math.floor(Math.random() * 20),
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        image_url: null
    };
}

async function createPost(title, content, imageUrl = null) {
    await delay(500);
    console.log('[DUMMY] 게시글 작성:', { title, content });
    return {
        id: Math.floor(Math.random() * 10000),
        title,
        content,
        image_url: imageUrl,
        author: createDummyUser(1),
        created_at: new Date().toISOString()
    };
}

async function updatePost(postId, title, content, imageUrl = null) {
    await delay(500);
    console.log('[DUMMY] 게시글 수정:', { postId, title });
    return { message: '수정 완료 (더미)' };
}

async function deletePost(postId) {
    await delay(500);
    console.log('[DUMMY] 게시글 삭제:', postId);
    return { message: '삭제 완료 (더미)' };
}

// ============================================================
// 좋아요 API (더미)
// ============================================================

async function likePost(postId) {
    await delay(300);
    console.log('[DUMMY] 좋아요:', postId);
    return { likes_count: Math.floor(Math.random() * 100) };
}

async function unlikePost(postId) {
    await delay(300);
    console.log('[DUMMY] 좋아요 취소:', postId);
    return { likes_count: Math.floor(Math.random() * 100) };
}

// ============================================================
// 댓글 API (더미)
// ============================================================

async function getComments(postId) {
    await delay(400);
    const response = await fetch(`${DUMMY_API_URL}/posts/${postId}/comments`);
    const comments = await response.json();
    
    return comments.map(comment => ({
        id: comment.id,
        content: comment.body,
        author: createDummyUser(Math.floor(Math.random() * 10) + 1),
        created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
    }));
}

async function createComment(postId, content) {
    await delay(500);
    console.log('[DUMMY] 댓글 작성:', { postId, content });
    return {
        id: Math.floor(Math.random() * 10000),
        content,
        author: createDummyUser(1),
        created_at: new Date().toISOString()
    };
}

async function updateComment(commentId, content) {
    await delay(500);
    console.log('[DUMMY] 댓글 수정:', { commentId, content });
    return { message: '수정 완료 (더미)' };
}

async function deleteComment(commentId) {
    await delay(500);
    console.log('[DUMMY] 댓글 삭제:', commentId);
    return { message: '삭제 완료 (더미)' };
}

// ============================================================
// 프로필 API (더미)
// ============================================================

async function updateProfile(nickname, profileImageUrl = null) {
    await delay(500);
    console.log('[DUMMY] 프로필 수정:', { nickname });
    return createDummyUser(1);
}

async function changePassword(currentPassword, newPassword) {
    await delay(500);
    console.log('[DUMMY] 비밀번호 변경');
    return { message: '비밀번호 변경 완료 (더미)' };
}

// ============================================================
// 이미지 업로드 API (더미)
// ============================================================

async function uploadImage(file, type = 'profile') {
    await delay(800);
    console.log('[DUMMY] 이미지 업로드:', { name: file.name, type });
    
    // Placeholder 이미지 반환
    const dummyUrl = `https://via.placeholder.com/400x400?text=${encodeURIComponent(file.name)}`;
    
    return {
        url: dummyUrl,
        message: '이미지 업로드 성공 (더미)'
    };
}