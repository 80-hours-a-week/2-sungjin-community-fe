/**
 * 회원정보수정 페이지 로직
 * ✅ IIFE 패턴으로 전역 스코프 오염 방지
 */

(function () {
    // ✅ 전역 변수를 IIFE 내부로 캡슐화
    let profileImageFile = null;
    let profileImageUrl = null;

    document.addEventListener('DOMContentLoaded', function () {
        console.log('✅ 회원정보 수정 페이지 로드');

        // 초기 데이터 로드
        loadUserProfile();

        // DOM 요소
        const form = document.getElementById('profileEditForm');
        const profileInput = document.getElementById('profileImage');
        const previewImage = document.getElementById('previewImage');
        const btnSelectImage = document.getElementById('btnSelectImage');
        const nicknameInput = document.getElementById('nickname');
        const submitButton = document.getElementById('btnSubmit');

        // 드롭다운 메뉴
        const btnMenu = document.getElementById('btnMenu');
        const dropdownMenu = document.getElementById('dropdownMenu');
        const btnLogout = document.getElementById('btnLogout');

        // 드롭다운 메뉴 토글
        if (btnMenu && dropdownMenu) {
            btnMenu.addEventListener('click', function (e) {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            document.addEventListener('click', function () {
                dropdownMenu.classList.remove('show');
            });
        }

        // 로그아웃
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

        // 이미지 선택 버튼
        if (btnSelectImage) {
            btnSelectImage.addEventListener('click', function () {
                profileInput.click();
            });
        }

        // 프로필 이미지 변경
        if (profileInput) {
            profileInput.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;

                console.log('📷 이미지 선택:', file.name, file.size);

                // 파일 크기 체크 (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('이미지 크기는 5MB 이하여야 합니다.');
                    return;
                }

                // 파일 타입 체크
                if (!file.type.startsWith('image/')) {
                    alert('이미지 파일만 업로드 가능합니다.');
                    return;
                }

                // ✅ IIFE 내부 변수에 저장
                profileImageFile = file;

                // 미리보기
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (previewImage) {
                        previewImage.src = e.target.result;
                    }
                    console.log('✅ 이미지 미리보기 완료');
                };
                reader.readAsDataURL(file);
            });
        }

        // 닉네임 입력 시 버튼 활성화
        // 닉네임 입력 시 실시간 검증 및 Helper Text 표시
        if (nicknameInput && submitButton) {
            nicknameInput.addEventListener('input', function () {
                const nickname = nicknameInput.value.trim();
                const nicknameError = document.getElementById('nicknameError');

                // 초기화
                if (nicknameError) {
                    nicknameError.style.display = 'none';
                    nicknameError.textContent = '';
                }

                if (!nickname) {
                    if (nicknameError) {
                        nicknameError.textContent = '*닉네임을 입력해주세요.';
                        nicknameError.style.display = 'block';
                    }
                    submitButton.style.background = '#ACA0EB';
                } else if (nickname.length > 10) {
                    // maxlength가 10이므로 발생 어렵지만 붙여넣기 등 대비
                    if (nicknameError) {
                        nicknameError.textContent = '*닉네임은 최대 10자 까지 작성 가능합니다.';
                        nicknameError.style.display = 'block';
                    }
                    submitButton.style.background = '#ACA0EB';
                } else if (nickname.includes(' ')) {
                    // 공백 체크? 
                    // Spec에 "닉네임 입력하지 않거나..." "중복 시..." "11자 이상..."
                    // 공백에 대한 명확한 문구는 없지만 보통 입력해주세요 처리
                    if (nicknameError) {
                        nicknameError.textContent = '*공백은 포함할 수 없습니다.'; // 임의 추가 혹은 입력해주세요로 처리
                        nicknameError.style.display = 'block';
                    }
                    submitButton.style.background = '#ACA0EB';
                } else {
                    // 10자 이하, 공백 없음 -> 유효
                    submitButton.style.background = '#7F6AEE';
                }
            });
        }

        // 폼 제출
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                console.log('📝 회원정보 수정 시도');

                // 에러 초기화
                const nicknameError = document.getElementById('nicknameError');
                if (nicknameError) {
                    nicknameError.textContent = '';
                    nicknameError.style.display = 'none';
                }

                const nickname = nicknameInput.value.trim();

                // 검증
                // 검증
                if (!nickname) {
                    if (nicknameError) {
                        nicknameError.textContent = '*닉네임을 입력해주세요.';
                        nicknameError.style.display = 'block';
                    }
                    return;
                }

                if (nickname.length > 10 || nickname.includes(' ')) {
                    if (nicknameError) {
                        nicknameError.textContent = '*닉네임은 최대 10자 까지 작성 가능합니다.';
                        nicknameError.style.display = 'block';
                    }
                    return;
                }

                try {
                    // 1. 프로필 이미지 업로드 (있는 경우)
                    if (profileImageFile) {
                        try {
                            console.log('📤 이미지 업로드 중...');
                            const uploadResult = await uploadImage(profileImageFile, 'profile');
                            profileImageUrl = uploadResult.data?.image_url || uploadResult.image_url;
                            console.log('✅ 이미지 업로드 완료:', profileImageUrl);
                        } catch (uploadError) {
                            console.log('⚠️ 이미지 업로드 실패 (선택사항이므로 계속 진행):', uploadError);
                        }
                    }

                    // 2. 프로필 수정 API 호출
                    console.log('📤 프로필 수정 요청:', { nickname, profileImageUrl });
                    const result = await updateProfile(nickname, profileImageUrl);

                    console.log('✅ 프로필 수정 성공:', result);

                    // 성공 알림 - 토스트 메시지
                    showToast('수정 완료');

                    // 프로필 다시 로드
                    await loadUserProfile();

                } catch (error) {
                    console.error('❌ 프로필 수정 실패:', error);
                    if (error.message && (error.message.includes('중복') || error.message.includes('duplicate'))) {
                        if (nicknameError) {
                            nicknameError.textContent = '*중복된 닉네임 입니다.';
                            nicknameError.style.display = 'block';
                        }
                    } else {
                        alert('회원정보 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
                    }
                }
            });
        }

        // 회원탈퇴
        const btnWithdraw = document.getElementById('btnWithdraw');
        const withdrawModal = document.getElementById('withdrawModal');
        const btnCancelWithdraw = document.getElementById('btnCancelWithdraw');
        const btnConfirmWithdraw = document.getElementById('btnConfirmWithdraw');

        if (btnWithdraw && withdrawModal) {
            btnWithdraw.addEventListener('click', function () {
                withdrawModal.style.display = 'flex'; // showModal -> display: flex
            });
        }

        if (btnCancelWithdraw && withdrawModal) {
            btnCancelWithdraw.addEventListener('click', function () {
                withdrawModal.style.display = 'none'; // close -> display: none
            });
        }

        // 배경 클릭 시 닫기
        if (withdrawModal) {
            withdrawModal.addEventListener('click', function (e) {
                if (e.target === withdrawModal) {
                    withdrawModal.style.display = 'none';
                }
            });
        }

        if (btnConfirmWithdraw && withdrawModal) {
            btnConfirmWithdraw.addEventListener('click', async function () {
                try {
                    console.log('🗑️ 회원탈퇴 요청');
                    await withdrawUser();
                    alert('회원탈퇴가 완료되었습니다.');
                    window.location.href = '/login';
                } catch (error) {
                    console.error('❌ 회원탈퇴 실패:', error);
                    alert('회원탈퇴에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
                }
                withdrawModal.style.display = 'none';
            });
        }
    });

    /**
     * ✅ 사용자 프로필 로드 (IIFE 내부 함수)
     */
    async function loadUserProfile() {
        try {
            console.log('📥 사용자 정보 로드 중...');

            const response = await getMe();

            console.log('✅ 사용자 정보 응답:', response);

            const user = response.data || response;

            console.log('✅ 사용자 데이터:', user);

            // 이메일 (읽기 전용)
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.value = user.email || '';
            }

            // 닉네임
            const nicknameInput = document.getElementById('nickname');
            if (nicknameInput) {
                nicknameInput.value = user.nickname || '';
            }

            // 프로필 이미지 - 기존 URL 저장 (수정 시 유지를 위해)
            if (user.profile_image_url && user.profile_image_url.trim() !== '') {
                profileImageUrl = user.profile_image_url;  // 기존 URL 저장!
            }

            const previewImage = document.getElementById('previewImage');
            if (previewImage) {
                if (user.profile_image_url && user.profile_image_url.trim() !== '') {
                    let imageUrl = user.profile_image_url;
                    if (imageUrl.startsWith('/')) {
                        imageUrl = `http://localhost:8000${imageUrl}`;
                    }
                    console.log('📷 프로필 이미지 URL:', imageUrl);
                    previewImage.src = imageUrl;
                    previewImage.onerror = function () {
                        console.log('⚠️ 프로필 이미지 로드 실패, 기본 이미지 사용');
                        this.src = '/images/default-profile.png';
                    };

                    // 헤더 프로필 이미지도 업데이트
                    const headerImage = document.getElementById('headerProfileImage');
                    if (headerImage) {
                        headerImage.src = imageUrl;
                        headerImage.onerror = function () {
                            this.src = '/images/default-profile.png';
                        };
                    }
                } else {
                    previewImage.src = '/images/default-profile.png';
                }
            }

            console.log('✅ 프로필 데이터 표시 완료');

        } catch (error) {
            console.error('❌ 프로필 로드 실패:', error);
            alert('사용자 정보를 불러오는데 실패했습니다.');
        }
    }
})();