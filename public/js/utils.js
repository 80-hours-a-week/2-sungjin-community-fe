/**
 * Shared utility helpers.
 */

function navigateTo(path) {
    window.location.href = path;
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (event) => {
        const navigateTarget = event.target.closest('[data-navigate]');
        const logoutTarget = event.target.closest('[data-logout]');
        const backTarget = event.target.closest('[data-history-back]');

        if (navigateTarget) {
            event.preventDefault();
            navigateTo(navigateTarget.dataset.navigate);
        }

        if (logoutTarget) {
            event.preventDefault();
            if (typeof handleLogout === 'function') {
                handleLogout();
            }
        }

        if (backTarget) {
            event.preventDefault();
            window.history.back();
        }
    });
});

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function truncateText(text, maxLength = 100) {
    const safeText = String(text || '');
    if (safeText.length <= maxLength) return safeText;
    return `${safeText.slice(0, maxLength)}...`;
}

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(String(email || ''));
}

function validatePassword(password) {
    return String(password || '').length >= 8;
}

function validateNickname(nickname) {
    const safeNickname = String(nickname || '');
    return safeNickname.length >= 2 && safeNickname.length <= 20;
}

function createElement(tag, className, textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

function showError(message, containerId = 'errorContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        alert(message);
        return;
    }

    container.innerHTML = `<div class="error">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function showSuccess(message, containerId = 'successContainer') {
    const container = document.getElementById(containerId);
    if (!container) {
        alert(message);
        return;
    }

    container.innerHTML = `<div class="success">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="loading">로딩 중...</div>';
}

function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
}

const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

function debounce(func, wait = 300) {
    let timeoutId = null;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
}

function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
}

function showConfirmDialog(message) {
    return window.confirm(message);
}

function formatNumber(num) {
    return Number(num || 0).toLocaleString('ko-KR');
}

function showToast(message, duration = 3000) {
    const currentToast = document.querySelector('.toast');
    if (currentToast) {
        currentToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

function resolveApiError(error, fallbackMessage = '요청 처리 중 오류가 발생했습니다.') {
    if (!error) {
        return {
            message: fallbackMessage,
            category: 'unknown'
        };
    }

    const status = Number(error.status || 0);
    const category = error.category || (
        status === 401 ? 'auth'
            : status === 403 ? 'forbidden'
                : (status === 400 || status === 422) ? 'validation'
                    : status === 0 ? 'network'
                        : status >= 500 ? 'server'
                            : 'unknown'
    );

    return {
        message: error.message || fallbackMessage,
        category
    };
}

function handleApiError(error, options = {}) {
    const {
        fallbackMessage = '요청 처리 중 오류가 발생했습니다.',
        containerId = null,
        redirectOnAuth = true
    } = options;

    const resolved = resolveApiError(error, fallbackMessage);

    if (containerId) {
        showError(resolved.message, containerId);
    } else {
        showToast(resolved.message);
    }

    if (resolved.category === 'auth' && redirectOnAuth && window.location.pathname !== '/login') {
        setTimeout(() => {
            navigateTo('/login');
        }, 200);
    }

    return resolved;
}

function showAuthNotice(containerId = 'errorContainer') {
    if (typeof popAuthNotice !== 'function') return;
    const notice = popAuthNotice();
    if (!notice) return;

    const container = document.getElementById(containerId);
    if (container) {
        showError(notice, containerId);
    } else {
        showToast(notice);
    }
}

async function handleLogout() {
    try {
        await logout();
        navigateTo('/login');
    } catch (error) {
        console.error('Logout failed:', error);
        showToast('로그아웃 중 문제가 발생했습니다.');
        navigateTo('/login');
    }
}
