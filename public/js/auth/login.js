/**
 * 로그인 페이지 로직 - 완전 구현
 * 명세 100% 반영
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // 실시간 검증 및 버튼 색상 변경
    emailInput.addEventListener('input', validateAndUpdateButton);
    passwordInput.addEventListener('input', validateAndUpdateButton);
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 에러 초기화
        hideError(emailInput, 'emailError');
        hideError(passwordInput, 'passwordError');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // 검증
        let isValid = true;
        
        // 이메일 검증
        if (!email) {
            showError(emailInput, 'emailError', '이메일을 입력해주세요');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError(emailInput, 'emailError', '올바른 이메일 주소 형식을 입력해주세요. (예: example@adapterz.kr)');
            isValid = false;
        }
        
        // 비밀번호 검증
        if (!password) {
            showError(passwordInput, 'passwordError', '비밀번호를 입력해주세요');
            isValid = false;
        } else if (!validatePasswordComplex(password)) {
            showError(passwordInput, 'passwordError', '비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.');
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            // 로그인 API 호출
            const response = await login(email, password);
            
            if (response.message === 'login_success' || response.success) {
                // 성공 - 게시글 목록으로 이동
                window.location.href = '/posts';
            }
        } catch (error) {
            console.error('Login error:', error);
            // 로그인 실패
            showError(passwordInput, 'passwordError', '아이디 또는 비밀번호를 확인해주세요');
        }
    });
    
    /**
     * 실시간 검증 및 버튼 색상 변경
     */
    function validateAndUpdateButton() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // 이메일과 비밀번호가 모두 입력되고 유효한지 확인
        const isEmailValid = email && validateEmail(email);
        const isPasswordValid = password && validatePasswordComplex(password);
        
        if (isEmailValid && isPasswordValid) {
            // 모두 유효 - 버튼 색상 변경 (ACA0EB → 7F6AEE)
            submitButton.style.background = '#7F6AEE';
            submitButton.disabled = false;
        } else {
            // 유효하지 않음 - 원래 색상
            submitButton.style.background = '#ACA0EB';
            submitButton.disabled = false; // 클릭은 가능하게 (에러 표시 위해)
        }
    }
});

/**
 * 비밀번호 복잡도 검증
 * 8자 이상, 20자 이하, 대문자, 소문자, 숫자, 특수문자 각 1개 이상
 */
function validatePasswordComplex(password) {
    if (password.length < 8 || password.length > 20) {
        return false;
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

function showError(input, errorId, message) {
    input.classList.add('error');
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideError(input, errorId) {
    input.classList.remove('error');
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}