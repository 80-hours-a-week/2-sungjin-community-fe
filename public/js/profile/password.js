/**
 * 비밀번호 수정 페이지 로직 - 완전 구현
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('passwordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const newPasswordConfirmInput = document.getElementById('newPasswordConfirm');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // 실시간 검증 및 버튼 색상 변경
    currentPasswordInput.addEventListener('input', validateAndUpdateButton);
    newPasswordInput.addEventListener('input', validateAndUpdateButton);
    newPasswordConfirmInput.addEventListener('input', validateAndUpdateButton);
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 에러 초기화
        hideFieldError('currentPassword');
        hideFieldError('newPassword');
        hideFieldError('newPasswordConfirm');
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const newPasswordConfirm = newPasswordConfirmInput.value;
        
        // 검증
        let isValid = true;
        
        // 현재 비밀번호
        if (!currentPassword) {
            showFieldError('currentPassword', '현재 비밀번호를 입력해주세요');
            isValid = false;
        }
        
        // 새 비밀번호
        if (!newPassword) {
            showFieldError('newPassword', '새 비밀번호를 입력해주세요');
            isValid = false;
        } else if (!validatePasswordComplex(newPassword)) {
            showFieldError('newPassword', '비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.');
            isValid = false;
        }
        
        // 새 비밀번호 확인
        if (!newPasswordConfirm) {
            showFieldError('newPasswordConfirm', '새 비밀번호 확인을 입력해주세요');
            isValid = false;
        } else if (newPassword !== newPasswordConfirm) {
            showFieldError('newPasswordConfirm', '비밀번호가 일치하지 않습니다');
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            // 비밀번호 변경 API 호출
            await changePassword(currentPassword, newPassword);
            
            // 성공 모달 표시
            const modal = document.getElementById('confirmModal');
            document.getElementById('modalMessage').textContent = '비밀번호가 변경되었습니다';
            modal.showModal();
            
            setTimeout(() => {
                modal.close();
                // 폼 초기화
                form.reset();
                submitButton.style.background = '#ACA0EB';
            }, 1500);
            
        } catch (error) {
            console.error('Password change error:', error);
            
            if (error.message && error.message.includes('invalid_password')) {
                showFieldError('currentPassword', '현재 비밀번호가 올바르지 않습니다');
            } else {
                alert('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
            }
        }
    });
    
    /**
     * 실시간 검증 및 버튼 색상 변경
     */
    function validateAndUpdateButton() {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const newPasswordConfirm = newPasswordConfirmInput.value;
        
        // 모든 필드가 입력되고 유효한지 확인
        const isCurrentValid = currentPassword.length > 0;
        const isNewValid = validatePasswordComplex(newPassword);
        const isConfirmValid = newPassword === newPasswordConfirm && newPasswordConfirm.length > 0;
        
        if (isCurrentValid && isNewValid && isConfirmValid) {
            // 모두 유효 - 버튼 색상 변경 (ACA0EB → 7F6AEE)
            submitButton.style.background = '#7F6AEE';
        } else {
            // 유효하지 않음 - 원래 색상
            submitButton.style.background = '#ACA0EB';
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

function closeModal() {
    const modal = document.getElementById('confirmModal');
    modal.close();
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) field.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function hideFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) field.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}