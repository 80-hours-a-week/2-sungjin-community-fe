document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = form.querySelector('button[type="submit"]');

    const bootstrapped = await ensureAuthenticated({ redirect: false });
    if (bootstrapped) {
        navigateTo('/posts');
        return;
    }

    const authNotice = typeof popAuthNotice === 'function' ? popAuthNotice() : null;
    if (authNotice) {
        showFieldError(passwordInput, 'passwordError', authNotice);
    }

    emailInput.addEventListener('input', validateAndUpdateButton);
    passwordInput.addEventListener('input', validateAndUpdateButton);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        hideFieldError(emailInput, 'emailError');
        hideFieldError(passwordInput, 'passwordError');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        let isValid = true;

        if (!email) {
            showFieldError(emailInput, 'emailError', '이메일을 입력해 주세요.');
            isValid = false;
        } else if (!validateEmail(email)) {
            showFieldError(emailInput, 'emailError', '올바른 이메일 형식으로 입력해 주세요.');
            isValid = false;
        }

        if (!password) {
            showFieldError(passwordInput, 'passwordError', '비밀번호를 입력해 주세요.');
            isValid = false;
        }

        if (!isValid) return;

        submitButton.disabled = true;

        try {
            await login(email, password);
            navigateTo('/posts');
        } catch (error) {
            const resolved = resolveApiError(error, '로그인에 실패했습니다.');

            if (resolved.category === 'validation' || resolved.category === 'unknown') {
                showFieldError(passwordInput, 'passwordError', resolved.message);
            } else {
                handleApiError(error, { redirectOnAuth: false });
            }
        } finally {
            submitButton.disabled = false;
        }
    });

    function validateAndUpdateButton() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const isReady = validateEmail(email) && password.length > 0;

        submitButton.style.background = isReady ? '#7F6AEE' : '#ACA0EB';
    }
});

function showFieldError(input, errorId, message) {
    input.classList.add('error');
    const errorElement = document.getElementById(errorId);
    if (!errorElement) return;

    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function hideFieldError(input, errorId) {
    input.classList.remove('error');
    const errorElement = document.getElementById(errorId);
    if (!errorElement) return;

    errorElement.textContent = '';
    errorElement.classList.remove('show');
}
