/**
 * 회원가입 페이지 로직 (설계도 기반 전면 재작성)
 */

(function () {
    let profileImageFile = null;
    let isEmailChecked = false;
    let checkedEmail = '';

    document.addEventListener('DOMContentLoaded', function () {
        console.log('✅ 회원가입 페이지 로드');

        // DOM 요소
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
        const passwordHelper = document.getElementById('passwordHelper');
        const passwordConfirmInput = document.getElementById('passwordConfirm');
        const passwordConfirmError = document.getElementById('passwordConfirmError');
        const nicknameInput = document.getElementById('nickname');
        const nicknameError = document.getElementById('nicknameError');
        const nicknameHelper = document.getElementById('nicknameHelper');
        const submitButton = form.querySelector('button[type="submit"]');

        // 초기 버튼 상태
        submitButton.style.background = '#ACA0EB';

        // 프로필 이미지 클릭 핸들러
        if (profilePreview && profileInput) {
            profilePreview.style.cursor = 'pointer';
            profilePreview.addEventListener('click', function () {
                // 이미지가 이미 있으면 삭제
                if (profileImageFile) {
                    profileImageFile = null;
                    profilePreview.innerHTML = '<div class="profile-placeholder">+</div>';
                    profileInput.value = '';
                    console.log('🗑️ 프로필 이미지 삭제됨');
                    validateAndUpdateButton();
                } else {
                    profileInput.click();
                }
            });
        }

        // 프로필 이미지 선택
        if (profileInput) {
            profileInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert('이미지 크기는 5MB 이하여야 합니다.');
                    profileInput.value = '';
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    alert('이미지 파일만 업로드 가능합니다.');
                    profileInput.value = '';
                    return;
                }

                profileImageFile = file;
                hideError(profileError);

                const reader = new FileReader();
                reader.onload = function (e) {
                    profilePreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                };
                reader.readAsDataURL(file);
                validateAndUpdateButton();
            });
        }

        // 이메일 중복확인 버튼
        if (btnCheckEmail) {
            btnCheckEmail.addEventListener('click', async function () {
                const email = emailInput.value.trim();

                hideError(emailError);

                if (!email) {
                    showError(emailError, '이메일을 입력해주세요.');
                    return;
                }

                if (!validateEmail(email)) {
                    showError(emailError, '올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
                    return;
                }

                try {
                    await checkEmail(email);
                    isEmailChecked = true;
                    checkedEmail = email;
                    emailHelper.textContent = '✓ 사용 가능한 이메일입니다';
                    emailHelper.style.color = '#28a745';
                    emailHelper.classList.add('show');
                    validateAndUpdateButton();
                } catch (error) {
                    isEmailChecked = false;
                    checkedEmail = '';
                    showError(emailError, '중복된 이메일 입니다.');
                }
            });
        }

        // 이메일 입력 변경 시 중복확인 초기화
        emailInput.addEventListener('input', function () {
            if (checkedEmail !== emailInput.value.trim()) {
                isEmailChecked = false;
                emailHelper.textContent = '* 영문과 @, . 만 사용이 가능함';
                emailHelper.style.color = '#999';
            }
            validateAndUpdateButton();
        });

        // 이메일 포커스 아웃 (Spec: 빈값, 형식 Check)
        emailInput.addEventListener('blur', function () {
            const email = emailInput.value.trim();
            if (!email) {
                showError(emailError, '*이메일을 입력해주세요.');
            } else if (!validateEmail(email)) {
                showError(emailError, '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
            }
        });

        // 비밀번호 입력
        passwordInput.addEventListener('input', function () {
            hideError(passwordError);
            validateAndUpdateButton();
        });

        passwordInput.addEventListener('blur', function () {
            const password = passwordInput.value;
            if (!password) {
                showError(passwordError, '*비밀번호를 입력해주세요.');
            } else if (!validatePasswordComplex(password)) {
                showError(passwordError, '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.');
            }
        });

        // 비밀번호 확인 입력
        passwordConfirmInput.addEventListener('input', function () {
            hideError(passwordConfirmError);
            validateAndUpdateButton();
        });

        passwordConfirmInput.addEventListener('blur', function () {
            const confirm = passwordConfirmInput.value;
            // 비밀번호 확인 입력 안했을시
            if (!confirm && passwordInput.value) { // Spec: 비밀번호 확인을 한 번 더 입력해주세요
                showError(passwordConfirmError, '*비밀번호를 한번 더 입력해주세요.');
            } else if (confirm && passwordInput.value !== confirm) {
                showError(passwordConfirmError, '*비밀번호가 다릅니다.');
            }
        });

        // 닉네임 입력
        nicknameInput.addEventListener('input', function () {
            const nickname = nicknameInput.value;
            hideError(nicknameError);

            // 띄어쓰기 검사
            if (nickname.includes(' ')) {
                showError(nicknameError, '*띄어쓰기를 없애주세요.');
            } else if (nickname.length > 10) {
                showError(nicknameError, '*닉네임은 최대 10자 까지 작성 가능합니다.');
            }
            validateAndUpdateButton();
        });

        nicknameInput.addEventListener('blur', function () {
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                showError(nicknameError, '*닉네임을 입력해주세요.');
            } else if (nickname.includes(' ')) {
                showError(nicknameError, '*띄어쓰기를 없애주세요.');
            } else if (nickname.length > 10) {
                showError(nicknameError, '*닉네임은 최대 10자 까지 작성 가능합니다.');
            }
        });

        // 폼 제출
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // 전체 유효성 검사
            let isValid = true;

            // 프로필 사진 검사
            if (!profileImageFile) {
                showError(profileError, '프로필 사진을 추가해주세요.');
                isValid = false;
            }

            // 이메일 검사
            const email = emailInput.value.trim();
            if (!email) {
                showError(emailError, '이메일을 입력해주세요.');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError(emailError, '올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
                isValid = false;
            } else if (!isEmailChecked || checkedEmail !== email) {
                showError(emailError, '이메일 중복확인을 해주세요.');
                isValid = false;
            }

            // 비밀번호 검사
            const password = passwordInput.value;
            if (!password) {
                showError(passwordError, '비밀번호를 입력해주세요.');
                isValid = false;
            } else if (!validatePasswordComplex(password)) {
                showError(passwordError, '비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.');
                isValid = false;
            }

            // 비밀번호 확인 검사
            const passwordConfirm = passwordConfirmInput.value;
            if (!passwordConfirm) {
                showError(passwordConfirmError, '비밀번호를 한번 더 입력해주세요.');
                isValid = false;
            } else if (password !== passwordConfirm) {
                showError(passwordConfirmError, '비밀번호가 다릅니다.');
                isValid = false;
            }

            // 닉네임 검사
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                showError(nicknameError, '닉네임을 입력해주세요.');
                isValid = false;
            } else if (nickname.includes(' ')) {
                showError(nicknameError, '띄어쓰기를 없애주세요.');
                isValid = false;
            } else if (nickname.length > 10) {
                showError(nicknameError, '닉네임은 최대 10자 까지 작성 가능합니다.');
                isValid = false;
            }

            if (!isValid) return;

            // 프로필 이미지 필수 체크
            if (!profileImageFile) {
                alert('프로필 이미지를 선택해주세요.');
                return;
            }

            try {
                submitButton.disabled = true;
                submitButton.textContent = '가입 중...';

                // 1단계: 회원가입
                const signupResult = await signup(email, password, nickname);
                console.log('✅ 회원가입 성공');

                // 2단계: 로그인 후 프로필 이미지 업로드
                await login(email, password);
                await new Promise(resolve => setTimeout(resolve, 500));

                const uploadResult = await uploadImage(profileImageFile, 'profile');
                const imageUrl = uploadResult.data?.image_url || uploadResult.image_url;

                if (imageUrl) {
                    await updateProfile(nickname, imageUrl);
                }

                await logout();

                // 모달 표시
                confirmModal.classList.add('show');

            } catch (error) {
                console.error('❌ 회원가입 실패:', error);

                // 에러 메시지에 따른 처리
                if (error.message.includes('닉네임') || error.message.includes('nickname')) {
                    showError(nicknameError, '중복된 닉네임 입니다.');
                } else if (error.message.includes('이메일') || error.message.includes('email')) {
                    showError(emailError, '중복된 이메일 입니다.');
                } else {
                    alert('회원가입에 실패했습니다: ' + error.message);
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = '회원가입';
            }
        });

        // 모달 닫기
        if (btnCloseModal) {
            btnCloseModal.addEventListener('click', function () {
                confirmModal.classList.remove('show');
                window.location.href = '/login';
            });
        }

        // 버튼 활성화 검사
        function validateAndUpdateButton() {
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const passwordConfirm = passwordConfirmInput.value;
            const nickname = nicknameInput.value.trim();

            const isProfileValid = profileImageFile !== null;
            const isEmailValid = validateEmail(email) && isEmailChecked && checkedEmail === email;
            const isPasswordValid = validatePasswordComplex(password);
            const isPasswordConfirmValid = password === passwordConfirm && passwordConfirm.length > 0;
            const isNicknameValid = nickname.length > 0 && nickname.length <= 10 && !nickname.includes(' ');

            if (isProfileValid && isEmailValid && isPasswordValid && isPasswordConfirmValid && isNicknameValid) {
                submitButton.style.background = '#7F6AEE';
            } else {
                submitButton.style.background = '#ACA0EB';
            }
        }

        // helper 함수들
        function showError(element, message) {
            if (element) {
                element.textContent = message;
                element.classList.add('show');
            }
        }

        function hideError(element) {
            if (element) {
                element.classList.remove('show');
            }
        }
    });

    /**
     * 비밀번호 복잡도 검증
     * 8자 이상, 20자 이하, 대문자, 소문자, 숫자, 특수문자 각 1개 이상
     */
    function validatePasswordComplex(password) {
        if (password.length < 8 || password.length > 20) return false;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    }
})();