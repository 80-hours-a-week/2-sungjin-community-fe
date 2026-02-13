/**
 * Password change page script
 */
document.addEventListener('DOMContentLoaded', async () => {
    const isReady = await ensureAuthenticated();
    if (!isReady) return;

    await loadHeaderProfile();
    bindDropdownMenu();

    const form = document.getElementById('passwordChangeForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = document.getElementById('btnSubmit');
    const passwordHelper = document.getElementById('passwordHelper');
    const confirmHelper = document.getElementById('confirmHelper');

    if (passwordHelper) passwordHelper.textContent = '';
    if (confirmHelper) confirmHelper.textContent = '';

    function updateValidationState() {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const passwordResult = validatePasswordComplex(newPassword);
        const isConfirmMatched = confirmPassword.length > 0 && newPassword === confirmPassword;
        const isCurrentProvided = currentPassword.length > 0;

        if (passwordHelper) {
            if (!newPassword) {
                passwordHelper.textContent = '*새 비밀번호를 입력해 주세요.';
                passwordHelper.style.color = '#999';
            } else if (!passwordResult.valid) {
                passwordHelper.textContent = '*8~20자, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해 주세요.';
                passwordHelper.style.color = '#dc3545';
            } else {
                passwordHelper.textContent = '사용 가능한 비밀번호입니다.';
                passwordHelper.style.color = '#28a745';
            }
        }

        if (confirmHelper) {
            if (!confirmPassword) {
                confirmHelper.textContent = '*새 비밀번호를 한 번 더 입력해 주세요.';
                confirmHelper.style.color = '#999';
            } else if (!isConfirmMatched) {
                confirmHelper.textContent = '*비밀번호가 일치하지 않습니다.';
                confirmHelper.style.color = '#dc3545';
            } else {
                confirmHelper.textContent = '비밀번호가 일치합니다.';
                confirmHelper.style.color = '#28a745';
            }
        }

        const canSubmit = isCurrentProvided && passwordResult.valid && isConfirmMatched;
        submitButton.style.background = canSubmit ? '#7F6AEE' : '#ACA0EB';
        return canSubmit;
    }

    currentPasswordInput.addEventListener('input', updateValidationState);
    newPasswordInput.addEventListener('input', updateValidationState);
    confirmPasswordInput.addEventListener('input', updateValidationState);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        clearFieldError('currentPasswordError');
        clearFieldError('newPasswordError');
        clearFieldError('confirmPasswordError');

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        let hasError = false;

        if (!currentPassword) {
            showFieldError('currentPasswordError', '현재 비밀번호를 입력해 주세요.');
            hasError = true;
        }

        const passwordResult = validatePasswordComplex(newPassword);
        if (!newPassword) {
            showFieldError('newPasswordError', '새 비밀번호를 입력해 주세요.');
            hasError = true;
        } else if (!passwordResult.valid) {
            showFieldError('newPasswordError', '8~20자, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해 주세요.');
            hasError = true;
        }

        if (!confirmPassword) {
            showFieldError('confirmPasswordError', '새 비밀번호 확인을 입력해 주세요.');
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            showFieldError('confirmPasswordError', '비밀번호가 일치하지 않습니다.');
            hasError = true;
        }

        if (hasError) return;

        submitButton.disabled = true;

        try {
            await changePassword(currentPassword, newPassword);
            showToast('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');

            setTimeout(async () => {
                await logout();
                navigateTo('/login');
            }, 1000);
        } catch (error) {
            const resolved = resolveApiError(error, '비밀번호 변경에 실패했습니다.');
            if (resolved.category === 'validation') {
                showFieldError('currentPasswordError', resolved.message);
            } else {
                handleApiError(error, {
                    fallbackMessage: '비밀번호 변경에 실패했습니다.'
                });
            }
        } finally {
            submitButton.disabled = false;
        }
    });
});

function bindDropdownMenu() {
    const btnMenu = document.getElementById('btnMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (!btnMenu || !dropdownMenu) return;

    btnMenu.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
}

function validatePasswordComplex(password) {
    const value = String(password || '');
    const isLengthValid = value.length >= 8 && value.length <= 20;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    return {
        valid: isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSpecial
    };
}

function showFieldError(errorElementId, message) {
    const target = document.getElementById(errorElementId);
    if (!target) return;
    target.textContent = message;
}

function clearFieldError(errorElementId) {
    const target = document.getElementById(errorElementId);
    if (!target) return;
    target.textContent = '';
}

async function loadHeaderProfile() {
    try {
        const response = await getMe();
        const user = response && response.data ? response.data : response;

        const headerImage = document.getElementById('headerProfileImage');
        if (!headerImage) return;

        if (user.profile_image_url) {
            headerImage.src = /^https?:\/\//i.test(user.profile_image_url)
                ? user.profile_image_url
                : toApiUrl(user.profile_image_url);
        }

        headerImage.onerror = function onHeaderImageError() {
            this.src = '/images/default-profile.png';
        };
    } catch (error) {
        console.debug('Failed to load header profile:', error.message);
    }
}
