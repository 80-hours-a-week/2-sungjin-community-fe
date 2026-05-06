/**
 * chatbot.js
 *
 * 식당 추천 챗봇 UI 컨트롤러.
 *
 * 기능:
 *   - POST /chatbot/chat  → 메시지 전송 + 응답 렌더링
 *   - POST /chatbot/reset → 대화 초기화
 *   - GET  /chatbot/status → 엔진 상태 확인
 *   - 추천 식당 카드 렌더링
 *   - 타이핑 인디케이터
 *   - Enter 전송 / Shift+Enter 줄바꿈
 *   - 예시 쿼리 클릭 → 입력창 삽입
 */
(function initChatbot() {
    'use strict';

    // ── DOM 참조 ─────────────────────────────────────────────────────────── //
    const messageList   = document.getElementById('messageList');
    const chatForm      = document.getElementById('chatForm');
    const chatInput     = document.getElementById('chatInput');
    const btnSend       = document.getElementById('btnSend');
    const btnReset      = document.getElementById('btnResetChat');
    const charCountEl   = document.getElementById('charCount');
    const engineStatus  = document.getElementById('engineStatus');
    const statusDot     = engineStatus && engineStatus.querySelector('.status-dot');
    const statusText    = engineStatus && engineStatus.querySelector('.status-text');
    const chatStatusText = document.getElementById('chatStatusText');

    if (!messageList || !chatForm || !chatInput || !btnSend) {
        return;
    }

    let isLoading = false;

    // ── 상태 확인 ────────────────────────────────────────────────────────── //
    async function checkStatus() {
        try {
            const res = await getChatbotStatus();
            const data = res && res.data ? res.data : res;
            const engineReady = data && data.recommendation_engine && data.recommendation_engine.ready;
            const shopCount = data && data.recommendation_engine && data.recommendation_engine.shop_count;
            const provider = data && data.chatbot && data.chatbot.provider;

            if (engineReady) {
                if (statusDot) statusDot.className = 'status-dot ready';
                if (statusText) statusText.textContent = `준비 완료 (매장 ${shopCount}개 · ${provider || 'mock'})`;
                if (chatStatusText) chatStatusText.textContent = `${shopCount}개 매장 데이터 로드됨`;
            } else {
                if (statusDot) statusDot.className = 'status-dot error';
                if (statusText) statusText.textContent = '추천 엔진 미로드 (CSV 파일 확인)';
                if (chatStatusText) chatStatusText.textContent = '추천 엔진 초기화 중...';
            }
        } catch (e) {
            if (statusDot) statusDot.className = 'status-dot error';
            if (statusText) statusText.textContent = '백엔드 연결 실패';
            if (chatStatusText) chatStatusText.textContent = '서버에 연결할 수 없습니다';
        }
    }

    // ── 메시지 렌더링 ────────────────────────────────────────────────────── //
    function appendUserMessage(text) {
        const el = document.createElement('div');
        el.className = 'user-bubble';
        el.innerHTML = `
            <div class="bubble-body">${escapeHtml(text)}</div>
        `;
        messageList.appendChild(el);
        scrollToBottom();
    }

    function appendBotMessage(reply, shops) {
        const el = document.createElement('div');
        el.className = 'message-bubble bot-bubble';

        const shopCardsHtml = shops && shops.length > 0
            ? `<div class="shop-cards">${shops.map(renderShopCard).join('')}</div>`
            : '';

        el.innerHTML = `
            <div class="bubble-avatar">식</div>
            <div class="bubble-body">
                <div class="message-content">${escapeHtml(reply)}</div>
                ${shopCardsHtml}
            </div>
        `;
        messageList.appendChild(el);
        scrollToBottom();
    }

    function renderShopCard(shop) {
        const name = escapeHtml(shop.shop_name || shop.shop_id || '');
        const addr = escapeHtml(shop.address || '');
        const cats = (shop.categories || []).map(c => `<span class="shop-tag">${escapeHtml(c)}</span>`).join('');
        const menus = (shop.menus || []).slice(0, 3).map(m => `<span class="shop-tag">${escapeHtml(m)}</span>`).join('');
        const facs = (shop.facilities || []).slice(0, 3).map(f => `<span class="shop-tag">${escapeHtml(f)}</span>`).join('');

        return `
            <div class="shop-card">
                <div class="shop-card-name">${name}</div>
                ${addr ? `<div class="shop-card-row"><span class="label">주소</span>${addr}</div>` : ''}
                ${cats ? `<div class="shop-card-row"><span class="label">종류</span>${cats}</div>` : ''}
                ${menus ? `<div class="shop-card-row"><span class="label">메뉴</span>${menus}</div>` : ''}
                ${facs ? `<div class="shop-card-row"><span class="label">편의</span>${facs}</div>` : ''}
            </div>
        `;
    }

    function appendTypingIndicator() {
        const el = document.createElement('div');
        el.className = 'typing-indicator';
        el.id = 'typingIndicator';
        el.innerHTML = `
            <div class="bubble-avatar">식</div>
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        messageList.appendChild(el);
        scrollToBottom();
        return el;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    function scrollToBottom() {
        messageList.scrollTop = messageList.scrollHeight;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '<br>');
    }

    // ── 세션 관리 ────────────────────────────────────────────────────────── //
    function getSessionId() {
        let sid = localStorage.getItem('chatbot_session_id');
        if (!sid) {
            if (window.crypto && typeof window.crypto.randomUUID === 'function') {
                sid = `session_${window.crypto.randomUUID()}`;
            } else {
                sid = 'session_' + Math.random().toString(36).slice(2, 11) + '_' + Date.now();
            }
            localStorage.setItem('chatbot_session_id', sid);
        }
        return sid;
    }

    const sessionId = getSessionId();

    // ── 전송 로직 ────────────────────────────────────────────────────────── //
    async function sendMessage() {
        const message = (chatInput.value || '').trim();
        if (!message || isLoading) return;

        isLoading = true;
        btnSend.disabled = true;
        chatInput.value = '';
        updateCharCount();
        chatInput.style.height = 'auto';

        appendUserMessage(message);
        appendTypingIndicator();

        try {
            const data = await chatWithBot(message, sessionId);
            removeTypingIndicator();

            const reply = data && data.reply ? data.reply : '죄송합니다. 응답을 받지 못했습니다.';
            const recommended = data && data.recommended ? data.recommended : [];
            appendBotMessage(reply, recommended);
        } catch (err) {
            removeTypingIndicator();
            appendBotMessage('죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', []);
        } finally {
            isLoading = false;
            btnSend.disabled = false;
            chatInput.focus();
        }
    }

    // ── 초기화 ───────────────────────────────────────────────────────────── //
    async function handleReset() {
        if (isLoading) return;
        if (!confirm('대화 기록을 초기화할까요?')) return;

        try {
            await resetChatSession(sessionId);
        } catch (e) {
            // 서버 측 초기화 실패해도 UI는 클리어
        }

        // 환영 메시지만 남기고 초기화
        messageList.innerHTML = `
            <div class="message-bubble bot-bubble">
                <div class="bubble-avatar">식</div>
                <div class="bubble-body">
                    <div class="message-content">대화 기록이 초기화되었습니다. 다시 식당 추천을 요청해보세요.</div>
                </div>
            </div>
        `;
    }

    // ── 글자 수 카운터 ───────────────────────────────────────────────────── //
    function updateCharCount() {
        const len = (chatInput.value || '').length;
        if (charCountEl) charCountEl.textContent = len;
        if (charCountEl) {
            if (len >= 480) {
                charCountEl.style.color = '#ef4444';
            } else {
                charCountEl.style.color = '';
            }
        }
    }

    // ── 이벤트 바인딩 ────────────────────────────────────────────────────── //
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    if (chatInput) {
        // Enter 전송, Shift+Enter 줄바꿈
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 자동 높이 조절
        chatInput.addEventListener('input', () => {
            updateCharCount();
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', handleReset);
    }

    // 예시 쿼리 클릭 → 입력창에 삽입 후 전송
    document.querySelectorAll('.tip-item').forEach((el) => {
        el.addEventListener('click', () => {
            const prompt = el.dataset.prompt || el.textContent.trim();
            if (chatInput) {
                chatInput.value = prompt;
                updateCharCount();
                chatInput.focus();
                sendMessage();
            }
        });
    });

    // ── 초기 실행 ────────────────────────────────────────────────────────── //
    document.addEventListener('DOMContentLoaded', () => {
        checkStatus();
        if (chatInput) chatInput.focus();
    });

})();
