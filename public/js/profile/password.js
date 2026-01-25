
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 비밀번호 변경 페이지 로드 (NEW VERSION v2)');
    
    const form = document.getElementById('passwordChangeForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = document.getElementById('btnSubmit');
    
    // 드롭다운 메뉴
    const btnMenu = document.getElementById('btnMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const btnLogout = document.getElementById('btnLogout');
    
    if (btnMenu && dropdownMenu) {
        btnMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
    }
    
    if (btnLogout) {
        btnLogout.addEventListener('click', async function() {
            try {
                await logout();
                window.location.href = '/login';
            } catch (error) {
                console.error('로그아웃 실패:', error);
            }
        });
    }
    
    // 실시간 검증 및 버튼 색상 변경
    function checkAllFields() {
        const current = currentPasswordInput.value;
        const newPw = newPasswordInput.value;
        const confirm = confirmPasswordInput.value;
        
        if (current && newPw && confirm && 
            newPw.length >= 8 && newPw === confirm) {
            submitButton.style.background = '#7F6AEE';
        } else {
            submitButton.style.background = '#ACA0EB';
        }
    }
    
    currentPasswordInput.addEventListener('input', checkAllFields);
    newPasswordInput.addEventListener('input', checkAllFields);
    confirmPasswordInput.addEventListener('input', checkAllFields);
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('='.repeat(50));
        console.log('🔐 비밀번호 변경 폼 제출 시작! (NEW VERSION v2)');
        console.log('='.repeat(50));
        
        // 에러 초기화
        document.getElementById('currentPasswordError').textContent = '';
        document.getElementById('newPasswordError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        console.log('📝 입력값 확인:', {
            currentPassword: currentPassword ? `입력됨 (${currentPassword.length}자)` : '❌ 없음',
            newPassword: newPassword ? `입력됨 (${newPassword.length}자)` : '❌ 없음',
            confirmPassword: confirmPassword ? `입력됨 (${confirmPassword.length}자)` : '❌ 없음'
        });
        
        // 검증
        let isValid = true;
        
        if (!currentPassword) {
            console.log('❌ 검증 실패: 현재 비밀번호 없음');
            document.getElementById('currentPasswordError').textContent = '현재 비밀번호를 입력해주세요';
            isValid = false;
        }
        
        if (!newPassword) {
            console.log('❌ 검증 실패: 새 비밀번호 없음');
            document.getElementById('newPasswordError').textContent = '새 비밀번호를 입력해주세요';
            isValid = false;
        } else if (!validatePasswordComplex(newPassword)) {
            console.log('❌ 검증 실패: 새 비밀번호 복잡도 미달');
            document.getElementById('newPasswordError').textContent = '8-20자, 대소문자, 숫자, 특수문자 각 1개 이상 포함해주세요';
            isValid = false;
        }
        
        // ⭐ 현재 비밀번호와 새 비밀번호 중복 체크
        if (currentPassword && newPassword && currentPassword === newPassword) {
            console.log('❌ 검증 실패: 현재 비밀번호와 새 비밀번호 동일');
            document.getElementById('newPasswordError').textContent = '새 비밀번호는 현재 비밀번호와 달라야 합니다';
            isValid = false;
        }
        
        if (newPassword !== confirmPassword) {
            console.log('❌ 검증 실패: 비밀번호 불일치');
            document.getElementById('confirmPasswordError').textContent = '비밀번호가 일치하지 않습니다';
            isValid = false;
        }
        
        if (!isValid) {
            console.log('❌ 검증 실패로 중단');
            console.log('='.repeat(50));
            return;
        }
        
        console.log('✅ 모든 검증 통과!');
        console.log('📤 API 호출 준비...');
        
        try {
            console.log('📡 changePassword 함수 호출 시작');
            console.log('📡 API 엔드포인트: http://localhost:8000/users/me/password');
            
            const response = await changePassword(currentPassword, newPassword);
            
            console.log('✅✅✅ 비밀번호 변경 API 성공!');
            console.log('✅ 응답 데이터:', response);
            
            // ⭐ 성공 메시지
            const successMsg = '✅ 비밀번호가 성공적으로 변경되었습니다!\n\n다시 로그인해주세요.';
            console.log('🎉 Alert 표시 시작:', successMsg);
            
            alert(successMsg);
            
            console.log('✅ Alert 표시 완료');
            console.log('🔓 로그아웃 시도...');
            
            // 로그아웃
            try {
                await logout();
                console.log('✅ 로그아웃 성공');
            } catch (e) {
                console.log('⚠️ 로그아웃 스킵:', e.message);
            }
            
            console.log('🔀 로그인 페이지로 이동...');
            console.log('='.repeat(50));
            
            window.location.href = '/login';
            
        } catch (error) {
            console.log('❌❌❌ 비밀번호 변경 실패!');
            console.error('❌ 에러 전체:', error);
            console.error('❌ 에러 타입:', typeof error);
            console.error('❌ 에러 메시지:', error.message);
            console.error('❌ 에러 스택:', error.stack);
            
            // 에러 메시지 파싱
            let errorMessage = '비밀번호 변경에 실패했습니다.';
            
            if (error.message) {
                if (error.message.includes('현재') || error.message.includes('wrong') || error.message.includes('current')) {
                    errorMessage = '현재 비밀번호가 올바르지 않습니다.';
                    document.getElementById('currentPasswordError').textContent = errorMessage;
                } else if (error.message.includes('동일') || error.message.includes('same')) {
                    errorMessage = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
                    document.getElementById('newPasswordError').textContent = errorMessage;
                } else {
                    errorMessage = error.message;
                }
            }
            
            console.log('🚨 에러 Alert 표시:', errorMessage);
            alert('❌ ' + errorMessage);
            console.log('='.repeat(50));
        }
    });
});

/**
 * 비밀번호 복잡도 검증
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
