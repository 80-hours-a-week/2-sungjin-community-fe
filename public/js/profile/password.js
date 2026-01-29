/**
 * 비밀번호 변경 페이지 로직
 * 설계도: 비밀번호, 비밀번호 확인 (현재 비밀번호 없음)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ 비밀번호 변경 페이지 로드');

    // 헤더 프로필 이미지 로드
    loadHeaderProfile();

    const form = document.getElementById('passwordChangeForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = document.getElementById('btnSubmit');
    const passwordHelper = document.getElementById('passwordHelper');
    const confirmHelper = document.getElementById('confirmHelper');

    // ✅ 초기화: 페이지 로드 시 잔상 제거 (User Issue Fix)
    if (passwordHelper) passwordHelper.textContent = '';
    if (confirmHelper) confirmHelper.textContent = '';

    // 드롭다운 메뉴
    const btnMenu = document.getElementById('btnMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const btnLogout = document.getElementById('btnLogout');

    if (btnMenu && dropdownMenu) {
        btnMenu.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', function () {
            dropdownMenu.classList.remove('show');
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async function () {
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
        const newPw = newPasswordInput.value;
        const confirm = confirmPasswordInput.value;

        // 비밀번호 유효성 검사 (8자 이상, 대문자, 소문자, 숫자, 특수문자)
        const hasMinLength = newPw.length >= 8;
        const hasUpperCase = /[A-Z]/.test(newPw);
        const hasLowerCase = /[a-z]/.test(newPw);
        const hasNumber = /\d/.test(newPw);
        const hasSpecialChar = /[@$!%*#?&]/.test(newPw);

        const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        const isConfirmValid = confirm.length > 0 && newPw === confirm;

        // Helper text 업데이트
        if (passwordHelper) {
            if (!newPw) {
                passwordHelper.textContent = '*비밀번호를 입력해주세요';
                passwordHelper.style.color = '#999';
            } else if (!hasMinLength || !isPasswordValid) {
                // Spec: "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다."
                passwordHelper.textContent = '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
                passwordHelper.style.color = '#dc3545';
            } else {
                passwordHelper.textContent = '✓ 유효한 비밀번호입니다';
                passwordHelper.style.color = '#28a745';
            }
        }

        if (confirmHelper) {
            if (!confirm) {
                // Spec: "비밀번호 확인 입력 안했을 시 : *비밀번호를 한번 더 입력해주세요"
                confirmHelper.textContent = '*비밀번호를 한번 더 입력해주세요';
                confirmHelper.style.color = '#999';
            } else if (newPw !== confirm) {
                // Spec: "비밀번호 확인이 비밀번호 다를시 : *비밀번호와 다릅니다."
                confirmHelper.textContent = '*비밀번호와 다릅니다.';
                confirmHelper.style.color = '#dc3545';
            } else {
                confirmHelper.textContent = '✓ 비밀번호가 일치합니다';
                confirmHelper.style.color = '#28a745';
            }
        }

        if (isPasswordValid && isConfirmValid) {
            submitButton.style.background = '#7F6AEE';
        } else {
            submitButton.style.background = '#ACA0EB';
        }
    }

    newPasswordInput.addEventListener('input', checkAllFields);
    confirmPasswordInput.addEventListener('input', checkAllFields);

    // 폼 제출
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        console.log('🔐 비밀번호 변경 폼 제출');

        // 에러 초기화
        document.getElementById('newPasswordError').textContent = '';
        document.getElementById('confirmPasswordError').textContent = '';

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // 검증
        let isValid = true;

        if (!newPassword) {
            document.getElementById('newPasswordError').textContent = '비밀번호를 입력해주세요';
            isValid = false;
        } else if (newPassword.length < 8) {
            document.getElementById('newPasswordError').textContent = '비밀번호는 8자 이상이어야 합니다';
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = '비밀번호가 일치하지 않습니다';
            isValid = false;
        }

        if (!isValid) return;

        try {
            console.log('📤 비밀번호 변경 API 호출');

            // 설계도에서는 현재 비밀번호 없음 - 빈 문자열로 전송
            // 백엔드에서 현재 비밀번호 검증을 건너뛰도록 수정 필요
            const response = await changePassword('', newPassword);

            console.log('✅ 비밀번호 변경 성공:', response);

            // 토스트 메시지 표시
            showToast('수정 완료');

            // 잠시 후 로그인 페이지로 이동
            setTimeout(() => {
                logout().then(() => {
                    window.location.href = '/login';
                }).catch(() => {
                    window.location.href = '/login';
                });
            }, 1500);

        } catch (error) {
            console.error('❌ 비밀번호 변경 실패:', error);
            document.getElementById('newPasswordError').textContent = error.message || '비밀번호 변경에 실패했습니다';
        }
    });
});

/**
 * 토스트 메시지 표시
 */
function showToast(message) {
    // 기존 토스트 제거
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 3초 후 자동 제거
    setTimeout(() => {
        toast.style.animation = 'fadeOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * 헤더 프로필 이미지 로드
 */
async function loadHeaderProfile() {
    try {
        const response = await getMe();
        const user = response.data || response;

        const headerImage = document.getElementById('headerProfileImage');
        if (headerImage && user.profile_image_url) {
            let imageUrl = user.profile_image_url;
            if (imageUrl.startsWith('/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
            }
            headerImage.src = imageUrl;
            headerImage.onerror = function () {
                this.src = '/images/default-profile.png';
            };
        }
    } catch (error) {
        console.log('헤더 프로필 로드 실패:', error);
    }
}
