/**
 * API 통신 모듈 (프로덕션용)
 * 
 * 환경변수 주입:
 * - server.js의 /config.js endpoint에서 window.ENV_CONFIG 제공
 * - HTML에서 <script src="/config.js"></script> 먼저 로드 필수
 */

// ============================================================
// 환경 설정 로드
// ============================================================
const getConfig = () => {
    // /config.js가 로드되었는지 확인
    if (!window.ENV_CONFIG) {
        console.error('❌ 환경변수가 로드되지 않았습니다.');
        console.error('HTML에서 <script src="/config.js"></script>를 api.js보다 먼저 로드하세요.');

        // Fallback (개발 환경 기본값)
        return {
            API_URL: 'http://localhost:8000',
            IS_DEV: true
        };
    }

    return {
        API_URL: window.ENV_CONFIG.API_URL,
        IS_DEV: window.ENV_CONFIG.IS_DEV,
        NODE_ENV: window.ENV_CONFIG.NODE_ENV
    };
};

const { API_URL, IS_DEV, NODE_ENV } = getConfig();

// 개발 환경 디버그
if (IS_DEV) {
    console.log('🔧 API 설정:', { API_URL, NODE_ENV });
}

// ============================================================
// 공통 요청 헬퍼
// ============================================================
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;

    try {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 쿠키 포함
        };

        const response = await fetch(url, { ...defaultOptions, ...options });

        // 인증 실패 → 로그인 페이지 리다이렉트
        if (response.status === 401) {
            console.warn('🔒 인증 만료. 로그인 페이지로 이동합니다.');
            window.location.href = '/login';
            return;
        }

        // 응답 처리
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP ${response.status}`
            }));
            throw new Error(error.message || error.detail || 'API 요청 실패');
        }

        return await response.json();
    } catch (error) {
        console.error(`API 요청 실패 [${endpoint}]:`, error);
        throw error;
    }
}

// ============================================================
// 인증 API
// ============================================================

// 회원가입
async function signup(email, password, nickname) {
    return apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, nickname })
    });
}

// 이메일 중복 확인
async function checkEmail(email) {
    return apiRequest('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

// 로그인
async function login(email, password) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// 로그아웃
async function logout() {
    return apiRequest('/auth/logout', {
        method: 'POST'
    });
}

// 내 정보 조회
async function getMe() {
    return apiRequest('/users/me');
}

// ============================================================
// 게시글 API
// ============================================================

// 게시글 목록 조회
async function getPosts(page = 1, limit = 10) {
    return apiRequest(`/posts?page=${page}&limit=${limit}&t=${Date.now()}`);
}

// 게시글 상세 조회
async function getPost(postId) {
    return apiRequest(`/posts/${postId}`);
}

// 게시글 작성
async function createPost(title, content, imageUrl = null) {
    return apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content, image_url: imageUrl })
    });
}

// 게시글 수정
async function updatePost(postId, title, content, imageUrl = null) {
    return apiRequest(`/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content, image_url: imageUrl })
    });
}

// 게시글 삭제
async function deletePost(postId) {
    return apiRequest(`/posts/${postId}`, {
        method: 'DELETE'
    });
}

// ============================================================
// 좋아요 API
// ============================================================

// 좋아요
async function likePost(postId) {
    return apiRequest(`/posts/${postId}/likes`, {
        method: 'POST'
    });
}

// 좋아요 취소
async function unlikePost(postId) {
    return apiRequest(`/posts/${postId}/likes`, {
        method: 'DELETE'
    });
}

// ============================================================
// 댓글 API
// ============================================================

// 댓글 목록 조회
async function getComments(postId) {
    return apiRequest(`/posts/${postId}/comments`);
}

// 댓글 작성
async function createComment(postId, content) {
    return apiRequest(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

// 댓글 수정
// 댓글 수정
async function updateComment(postId, commentId, content) {
    return apiRequest(`/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
    });
}

// 댓글 삭제
// 댓글 삭제
async function deleteComment(postId, commentId) {
    return apiRequest(`/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
    });
}

// ============================================================
// 프로필 API
// ============================================================

// 프로필 수정
async function updateProfile(nickname, profileImageUrl = null) {
    return apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ nickname, profile_image_url: profileImageUrl })
    });
}

// 비밀번호 변경 (current_password 필수)
// 401 에러를 리다이렉트 대신 에러로 처리 (현재 비밀번호 틀림)
async function changePassword(currentPassword, newPassword) {
    const url = `${API_URL}/users/me/password`;

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        // 401은 현재 비밀번호 틀림으로 처리 (리다이렉트 안함)
        if (response.status === 401) {
            throw new Error('현재 비밀번호가 올바르지 않습니다');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP ${response.status}`
            }));
            throw new Error(error.message || '비밀번호 변경 실패');
        }

        return await response.json();
    } catch (error) {
        console.error('Password change error:', error);
        throw error;
    }
}

// 회원탈퇴
async function withdrawUser() {
    return apiRequest('/users/me', {
        method: 'DELETE'
    });
}

// ============================================================
// 이미지 업로드 API
// ============================================================

// 이미지 업로드
async function uploadImage(file, type = 'profile') {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/images/${type}`, {
            method: 'POST',
            credentials: 'include',
            body: formData
            // Content-Type은 브라우저가 자동 설정 (multipart/form-data)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: '이미지 업로드 실패'
            }));
            throw new Error(error.message);
        }

        return await response.json();
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}