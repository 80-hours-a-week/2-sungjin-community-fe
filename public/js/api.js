/**
 * API 통신 모듈
 * Fetch API를 사용하여 백엔드 서버와 통신
 */

// API Base URL (백엔드 서버)
const API_URL = 'http://localhost:8000';

// JSONPlaceholder (더미 데이터)
const DUMMY_API_URL = 'https://jsonplaceholder.typicode.com';

/**
 * API 요청 헬퍼 함수
 */
async function apiRequest(url, options = {}) {
    try {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // 쿠키 포함
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        // 응답 상태 확인
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP Error: ${response.status}`
            }));
            throw new Error(error.message || 'API 요청 실패');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * ==================== 더미 데이터 API ====================
 */

// 더미 게시글 가져오기
async function fetchDummyPosts(limit = 3) {
    try {
        const response = await fetch(`${DUMMY_API_URL}/posts?_limit=${limit}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch dummy posts:', error);
        return [];
    }
}

// 더미 게시글 상세 가져오기
async function fetchDummyPost(postId) {
    try {
        const response = await fetch(`${DUMMY_API_URL}/posts/${postId}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch dummy post:', error);
        return null;
    }
}

// 더미 댓글 가져오기
async function fetchDummyComments(postId) {
    try {
        const response = await fetch(`${DUMMY_API_URL}/posts/${postId}/comments`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch dummy comments:', error);
        return [];
    }
}

/**
 * ==================== 백엔드 API ====================
 */

// 회원가입
async function signup(email, password, nickname) {
    return apiRequest(`${API_URL}/users/signup`, {
        method: 'POST',
        body: JSON.stringify({ email, password, nickname })
    });
}

// 로그인
async function login(email, password) {
    return apiRequest(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// 로그아웃
async function logout() {
    return apiRequest(`${API_URL}/auth/logout`, {
        method: 'POST'
    });
}

// 내 정보 조회
async function getMe() {
    return apiRequest(`${API_URL}/users/me`);
}

// 게시글 목록 조회
async function getPosts(page = 1, limit = 10) {
    return apiRequest(`${API_URL}/posts?page=${page}&limit=${limit}`);
}

// 게시글 상세 조회
async function getPost(postId) {
    return apiRequest(`${API_URL}/posts/${postId}`);
}

// 게시글 작성
async function createPost(title, content, imageUrl = null) {
    return apiRequest(`${API_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify({ title, content, image_url: imageUrl })
    });
}

// 게시글 수정
async function updatePost(postId, title, content, imageUrl = null) {
    return apiRequest(`${API_URL}/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content, image_url: imageUrl })
    });
}

// 게시글 삭제
async function deletePost(postId) {
    return apiRequest(`${API_URL}/posts/${postId}`, {
        method: 'DELETE'
    });
}

// 좋아요
async function likePost(postId) {
    return apiRequest(`${API_URL}/posts/${postId}/likes`, {
        method: 'POST'
    });
}

// 좋아요 취소
async function unlikePost(postId) {
    return apiRequest(`${API_URL}/posts/${postId}/likes`, {
        method: 'DELETE'
    });
}

// 댓글 목록 조회
async function getComments(postId) {
    return apiRequest(`${API_URL}/posts/${postId}/comments`);
}

// 댓글 작성
async function createComment(postId, content) {
    return apiRequest(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
    });
}

// 댓글 수정
async function updateComment(commentId, content) {
    return apiRequest(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
    });
}

// 댓글 삭제
async function deleteComment(commentId) {
    return apiRequest(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE'
    });
}

// 이미지 업로드
async function uploadImage(file, type = 'profile') {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/images/${type}`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!response.ok) {
            throw new Error('이미지 업로드 실패');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// 프로필 수정
async function updateProfile(nickname, profileImageUrl = null) {
    return apiRequest(`${API_URL}/users/me`, {
        method: 'PUT',
        body: JSON.stringify({ nickname, profile_image_url: profileImageUrl })
    });
}

// 비밀번호 변경
async function changePassword(currentPassword, newPassword) {
    return apiRequest(`${API_URL}/users/me/password`, {
        method: 'PUT',
        body: JSON.stringify({ 
            current_password: currentPassword, 
            new_password: newPassword 
        })
    });
}