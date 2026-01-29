/**
 * 유틸리티 함수 모음
 */

/**
 * 페이지 이동
 */
function navigateTo(path) {
    window.location.href = path;
}

/**
 * 전역 이벤트 리스너 (Delegation)
 * - data-navigate: 페이지 이동
 * - data-logout: 로그아웃
 * - data-history-back: 뒤로가기
 */
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        const navigateTarget = e.target.closest('[data-navigate]');
        const logoutTarget = e.target.closest('[data-logout]');
        const backTarget = e.target.closest('[data-history-back]');

        if (navigateTarget) {
            e.preventDefault(); // a 태그일 경우 대비
            navigateTo(navigateTarget.dataset.navigate);
        }

        if (logoutTarget) {
            e.preventDefault();
            if (typeof handleLogout === 'function') {
                handleLogout();
            }
        }

        if (backTarget) {
            e.preventDefault();
            window.history.back();
        }
    });
});

/**
 * 날짜 포맷팅
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
        return '방금 전';
    }

    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}분 전`;
    }

    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}시간 전`;
    }

    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}일 전`;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 텍스트 길이 제한
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * 이메일 검증
 */
function validateEmail(email) {
    // 영문, 숫자, 특수문자 허용 (한글 제외)
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

/**
 * 비밀번호 검증
 */
function validatePassword(password) {
    return password.length >= 8;
}

/**
 * 닉네임 검증
 */
function validateNickname(nickname) {
    return nickname.length >= 2 && nickname.length <= 20;
}

/**
 * DOM 요소 생성
 */
function createElement(tag, className, textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

/**
 * 에러 메시지 표시
 */
function showError(message, containerId = 'errorContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        alert(message);
        return;
    }

    container.innerHTML = `
        <div class="error">
            ${message}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message, containerId = 'successContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        alert(message);
        return;
    }

    container.innerHTML = `
        <div class="success">
            ${message}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

/**
 * 로딩 표시
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            로딩 중...
        </div>
    `;
}

/**
 * 로딩 숨김
 */
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
}

/**
 * 로컬 스토리지 관리
 */
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }
};

/**
 * 디바운스 함수
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 쿼리 파라미터 가져오기
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * HTML 이스케이프 (XSS 방지)
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * ✅ 확인 대화상자 (함수명 변경: confirm → showConfirmDialog)
 * window.confirm()과 이름 충돌 방지
 */
function showConfirmDialog(message) {
    return window.confirm(message);
}

/**
 * 숫자 포맷팅 (천단위 콤마)
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 토스트 메시지 표시
 */
function showToast(message, duration = 3000) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 표시
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // 숨김
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * 로그아웃 핸들러 (전역 함수)
 */
async function handleLogout() {
    try {
        await logout(); // api.js의 logout 함수 호출
        window.location.href = '/login';
    } catch (error) {
        console.error('로그아웃 실패:', error);
        alert('로그아웃에 실패했습니다.');
    }
}