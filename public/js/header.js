/**
 * Dynamic header component.
 * Injects the shared header HTML into a <div id="headerSlot"> placeholder.
 */
(function initHeader() {
    'use strict';

    function buildHeaderHtml(options) {
        const title = options.title || '아무 말 대잔치';
        const backAction = options.backAction || 'navigate';
        const backTarget = options.backTarget || '/';

        const backAttr = backAction === 'history'
            ? 'data-history-back="true"'
            : `data-navigate="${backTarget}"`;

        return `
            <header class="header-simple">
                <div class="header-container">
                    <button class="btn-back" aria-label="뒤로 가기" ${backAttr}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                    </button>
                    <h1 class="header-title">${title}</h1>
                    <div class="dropdown-wrapper">
                        <button class="btn-menu" id="btnMenu" aria-label="프로필 메뉴 펼치기">
                            <img
                                id="headerProfileImage"
                                src="/images/default-profile.png"
                                alt="프로필"
                                class="header-profile-img"
                                loading="lazy"
                                style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"
                            >
                        </button>
                        <div class="dropdown-menu" id="dropdownMenu">
                            <button data-navigate="/messages">1:1 메시지</button>
                            <button data-navigate="/profile/edit">회원정보수정</button>
                            <button data-navigate="/password/change">비밀번호수정</button>
                            <button data-theme-toggle="true">테마 전환 🌓</button>
                            <button data-logout="true" id="btnLogout">로그아웃</button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    function injectHeader() {
        const slot = document.getElementById('headerSlot');
        if (!slot) return;

        const options = {
            title: slot.dataset.title || '아무 말 대잔치',
            backAction: slot.dataset.backAction || 'navigate',
            backTarget: slot.dataset.backTarget || '/'
        };

        slot.innerHTML = buildHeaderHtml(options);
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', injectHeader);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { buildHeaderHtml, injectHeader };
    }
})();
