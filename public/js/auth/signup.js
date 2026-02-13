/**
 * Signup page script
 */
(function initSignupPage() {
    let profileImageFile = null;
    let checkedEmail = '';

    document.addEventListener('DOMContentLoaded', async () => {
        const alreadySignedIn = await ensureAuthenticated({ redirect: false });
        if (alreadySignedIn) {
            navigateTo('/posts');
            return;
        }

        const form = document.getElementById('signupForm');
        const profileInput = document.getElementById('profileImage');
        const profilePreview = document.getElementById('profilePreview');
        const profileError = document.getElementById('profileError');
        const confirmModal = document.getElementById('confirmModal');
        const btnCloseModal = document.getElementById('btnCloseModal');
        const emailInput = document.getElementById('email');
        const btnCheckEmail = document.getElementById('btnCheckEmail');
        const emailHelper = document.getElementById('emailHelper');
        const emailError = document.getElementById('emailError');
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('passwordError');
        const passwordConfirmInput = document.getElementById('passwordConfirm');
        const passwordConfirmError = document.getElementById('passwordConfirmError');
        const nicknameInput = document.getElementById('nickname');
        const nicknameError = document.getElementById('nicknameError');
        const submitButton = form.querySelector('button[type="submit"]');

        submitButton.style.background = '#ACA0EB';

        if (profilePreview && profileInput) {
            profilePreview.addEventListener('click', () => {
                if (profileImageFile) {
                    clearProfileImage(profileInput, profilePreview);
                    validateAndUpdateButton();
                    return;
                }
                profileInput.click();
            });
        }

        if (profileInput) {
            profileInput.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    showFieldError(profileError, '이미지 크기는 5MB 이하여야 합니다.');
                    profileInput.value = '';
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    showFieldError(profileError, '이미지 파일만 업로드 가능합니다.');
                    profileInput.value = '';
                    return;
                }

                profileImageFile = file;
                hideFieldError(profileError);

                const reader = new FileReader();
                reader.onload = (readEvent) => {
                    profilePreview.innerHTML = `
                        <img
                            src="${readEvent.target.result}"
                            style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                            alt="프로필 미리보기"
                        >
                    `;
                };
                reader.readAsDataURL(file);
                validateAndUpdateButton();
            });
        }

        if (btnCheckEmail) {
            btnCheckEmail.addEventListener('click', async () => {
                const email = emailInput.value.trim();
                hideFieldError(emailError);

                if (!email) {
                    showFieldError(emailError, '이메일을 입력해 주세요.');
                    return;
                }

                if (!validateEmail(email)) {
                    showFieldError(emailError, '올바른 이메일 형식으로 입력해 주세요. (예: example@example.com)');
                    return;
                }

                btnCheckEmail.disabled = true;

                try {
                    await checkEmail(email);
                    checkedEmail = email;
                    emailHelper.textContent = '사용 가능한 이메일입니다.';
                    emailHelper.style.color = '#28a745';
                } catch (error) {
                    // If backend removed check-email endpoint, do not block signup.
                    if (Number(error.status) === 404) {
                        checkedEmail = email;
                        emailHelper.textContent = '이메일 중복 확인 API를 지원하지 않아 가입 시 검증됩니다.';
                        emailHelper.style.color = '#f59e0b';
                    } else {
                        checkedEmail = '';
                        const resolved = resolveApiError(error, '중복된 이메일이거나 확인에 실패했습니다.');
                        showFieldError(emailError, resolved.message);
                    }
                } finally {
                    btnCheckEmail.disabled = false;
                    validateAndUpdateButton();
                }
            });
        }

        emailInput.addEventListener('input', () => {
            if (checkedEmail !== emailInput.value.trim()) {
                checkedEmail = '';
                emailHelper.textContent = '@를 포함한 이메일 형식으로 입력해 주세요.';
                emailHelper.style.color = '#999';
            }
            hideFieldError(emailError);
            validateAndUpdateButton();
        });

        passwordInput.addEventListener('input', () => {
            hideFieldError(passwordError);
            validateAndUpdateButton();
        });

        passwordConfirmInput.addEventListener('input', () => {
            hideFieldError(passwordConfirmError);
            validateAndUpdateButton();
        });

        nicknameInput.addEventListener('input', () => {
            hideFieldError(nicknameError);
            validateAndUpdateButton();
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const passwordConfirm = passwordConfirmInput.value;
            const nickname = nicknameInput.value.trim();

            const errors = validateSignupForm({
                profileImageFile,
                email,
                checkedEmail,
                password,
                passwordConfirm,
                nickname
            });

            hideFieldError(profileError);
            hideFieldError(emailError);
            hideFieldError(passwordError);
            hideFieldError(passwordConfirmError);
            hideFieldError(nicknameError);

            if (errors.profile) showFieldError(profileError, errors.profile);
            if (errors.email) showFieldError(emailError, errors.email);
            if (errors.password) showFieldError(passwordError, errors.password);
            if (errors.passwordConfirm) showFieldError(passwordConfirmError, errors.passwordConfirm);
            if (errors.nickname) showFieldError(nicknameError, errors.nickname);

            if (Object.keys(errors).length > 0) return;

            submitButton.disabled = true;
            submitButton.textContent = '가입 중...';

            try {
                await signup(email, password, nickname);

                await login(email, password);
                if (profileImageFile) {
                    const uploadResult = await uploadImage(profileImageFile, 'profile');
                    const imageUrl = uploadResult && uploadResult.data
                        ? uploadResult.data.image_url
                        : uploadResult.image_url;
                    await updateProfile(nickname, imageUrl || null);
                }
                await logout();

                confirmModal.style.display = 'flex';
            } catch (error) {
                const resolved = resolveApiError(error, '회원가입에 실패했습니다.');
                if (resolved.message.includes('이메일')) {
                    showFieldError(emailError, resolved.message);
                } else if (resolved.message.includes('닉네임')) {
                    showFieldError(nicknameError, resolved.message);
                } else {
                    showToast(resolved.message);
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = '회원가입';
            }
        });

        if (btnCloseModal) {
            btnCloseModal.addEventListener('click', () => {
                confirmModal.style.display = 'none';
                navigateTo('/login');
            });
        }

        function validateAndUpdateButton() {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const passwordConfirm = passwordConfirmInput.value;
            const nickname = nicknameInput.value.trim();

            const isProfileValid = profileImageFile !== null;
            const isEmailValid = validateEmail(email) && checkedEmail === email;
            const isPasswordValid = validatePasswordComplex(password);
            const isPasswordConfirmValid = password === passwordConfirm && passwordConfirm.length > 0;
            const isNicknameValid = nickname.length >= 2 && nickname.length <= 20 && !nickname.includes(' ');

            submitButton.style.background = (
                isProfileValid &&
                isEmailValid &&
                isPasswordValid &&
                isPasswordConfirmValid &&
                isNicknameValid
            ) ? '#7F6AEE' : '#ACA0EB';
        }
    });

    function validateSignupForm(payload) {
        const errors = {};

        if (!payload.profileImageFile) {
            errors.profile = '프로필 사진을 추가해 주세요.';
        }

        if (!payload.email) {
            errors.email = '이메일을 입력해 주세요.';
        } else if (!validateEmail(payload.email)) {
            errors.email = '올바른 이메일 형식으로 입력해 주세요. (예: example@example.com)';
        } else if (payload.checkedEmail !== payload.email) {
            errors.email = '이메일 중복 확인을 진행해 주세요.';
        }

        if (!payload.password) {
            errors.password = '비밀번호를 입력해 주세요.';
        } else if (!validatePasswordComplex(payload.password)) {
            errors.password = '8~20자, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해 주세요.';
        }

        if (!payload.passwordConfirm) {
            errors.passwordConfirm = '비밀번호를 한 번 더 입력해 주세요.';
        } else if (payload.password !== payload.passwordConfirm) {
            errors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
        }

        if (!payload.nickname) {
            errors.nickname = '닉네임을 입력해 주세요.';
        } else if (payload.nickname.includes(' ')) {
            errors.nickname = '닉네임에는 공백을 사용할 수 없습니다.';
        } else if (payload.nickname.length < 2 || payload.nickname.length > 20) {
            errors.nickname = '닉네임은 2~20자 사이여야 합니다.';
        }

        return errors;
    }

    function validatePasswordComplex(password) {
        const value = String(password || '');
        if (value.length < 8 || value.length > 20) return false;
        return (
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(value)
        );
    }

    function showFieldError(element, message) {
        if (!element) return;
        element.textContent = message;
        element.classList.add('show');
    }

    function hideFieldError(element) {
        if (!element) return;
        element.textContent = '';
        element.classList.remove('show');
    }

    function clearProfileImage(profileInput, profilePreview) {
        profileImageFile = null;
        profileInput.value = '';
        profilePreview.innerHTML = '<div class="profile-placeholder">+</div>';
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { validatePasswordComplex, validateSignupForm };
    }
})();
