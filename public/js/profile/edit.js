/**
 * 회원정보수정 페이지 로직
 */

let profileImageFile = null;
let profileImageUrl = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 회원정보 수정 페이지 로드');
    
    loadUserProfile();
    
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
    
    // 이미지 선택 버튼 클릭
    if (btnSelectImage) {
        btnSelectImage.addEventListener('click', function() {
            profileInput.click();
        });
    }
    
    // 프로필 이미지 변경
    profileInput.addEventListener('change', function(e) {
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
        
        profileImageFile = file;
        
        // 미리보기
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            console.log('✅ 이미지 미리보기 완료');
        };
        reader.readAsDataURL(file);
    });
    
    // 닉네임 입력 시 버튼 색상 변경
    nicknameInput.addEventListener('input', function() {
        const nickname = nicknameInput.value.trim();
        
        if (nickname && nickname.length >= 2 && nickname.length <= 20) {
            submitButton.style.background = '#7F6AEE';
        } else {
            submitButton.style.background = '#ACA0EB';
        }
    });
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
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
        if (!nickname) {
            if (nicknameError) {
                nicknameError.textContent = '닉네임을 입력해주세요';
                nicknameError.style.display = 'block';
            }
            return;
        }
        
        if (nickname.length < 2 || nickname.length > 20) {
            if (nicknameError) {
                nicknameError.textContent = '닉네임은 2-20자 사이여야 합니다';
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
            
            // 성공 알림
            alert('회원정보가 수정되었습니다.');
            
            // 프로필 다시 로드
            await loadUserProfile();
            
            // 게시글 목록으로 이동
            window.location.href = '/posts';
            
        } catch (error) {
            console.error('❌ 프로필 수정 실패:', error);
            alert('회원정보 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        }
    });
    
    // 회원탈퇴 버튼
    const btnWithdraw = document.getElementById('btnWithdraw');
    const withdrawModal = document.getElementById('withdrawModal');
    const btnCancelWithdraw = document.getElementById('btnCancelWithdraw');
    const btnConfirmWithdraw = document.getElementById('btnConfirmWithdraw');
    
    if (btnWithdraw && withdrawModal) {
        btnWithdraw.addEventListener('click', function() {
            withdrawModal.showModal();
        });
    }
    
    if (btnCancelWithdraw && withdrawModal) {
        btnCancelWithdraw.addEventListener('click', function() {
            withdrawModal.close();
        });
    }
    
    if (btnConfirmWithdraw && withdrawModal) {
        btnConfirmWithdraw.addEventListener('click', async function() {
            try {
                console.log('🗑️ 회원탈퇴 요청');
                await withdrawUser();
                alert('회원탈퇴가 완료되었습니다.');
                window.location.href = '/login';
            } catch (error) {
                console.error('❌ 회원탈퇴 실패:', error);
                alert('회원탈퇴에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
            }
            withdrawModal.close();
        });
    }
});

/**
 * 사용자 프로필 로드
 */
async function loadUserProfile() {
    try {
        console.log('📥 사용자 정보 로드 중...');
        
        const response = await getMe();  // ⭐ getMyProfile → getMe
        
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
        
        // 프로필 이미지
        if (user.profile_image_url) {
            const previewImage = document.getElementById('previewImage');
            if (previewImage) {
                previewImage.src = user.profile_image_url;
            }
        }
        
        console.log('✅ 프로필 데이터 표시 완료');
        
    } catch (error) {
        console.error('❌ 프로필 로드 실패:', error);
        alert('사용자 정보를 불러오는데 실패했습니다.');
    }
}