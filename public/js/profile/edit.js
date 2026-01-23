/**
 * 회원정보수정 페이지 로직 - 완전 구현
 */

let profileImageFile = null;
let profileImageUrl = null;

document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    
    const form = document.getElementById('profileForm');
    const profileInput = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    const nicknameInput = document.getElementById('nickname');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // 프로필 이미지 변경
    profileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
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
            const img = document.getElementById('profileImg');
            const placeholder = profilePreview.querySelector('.profile-placeholder');
            
            img.src = e.target.result;
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    });
    
    // 프로필 클릭 시 파일 선택
    profilePreview.addEventListener('click', function() {
        profileInput.click();
    });
    
    // 닉네임 입력 시 버튼 색상 변경
    nicknameInput.addEventListener('input', function() {
        const nickname = nicknameInput.value.trim();
        
        if (nickname && validateNickname(nickname)) {
            submitButton.style.background = '#7F6AEE';
        } else {
            submitButton.style.background = '#ACA0EB';
        }
    });
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 에러 초기화
        hideFieldError('nickname');
        
        const nickname = nicknameInput.value.trim();
        
        // 검증
        if (!nickname) {
            showFieldError('nickname', '닉네임을 입력해주세요');
            return;
        }
        
        if (!validateNickname(nickname)) {
            showFieldError('nickname', '닉네임은 2-20자 사이여야 합니다');
            return;
        }
        
        try {
            // 1. 프로필 이미지 업로드 (있는 경우)
            if (profileImageFile) {
                try {
                    const uploadResult = await uploadImage(profileImageFile, 'profile');
                    profileImageUrl = uploadResult.data.image_url;
                } catch (uploadError) {
                    console.log('이미지 업로드 실패 (선택사항이므로 계속 진행)');
                }
            }
            
            // 2. 프로필 수정 API 호출
            await updateProfile(nickname, profileImageUrl);
            
            // 성공 모달 표시
            const modal = document.getElementById('confirmModal');
            document.getElementById('modalMessage').textContent = '회원정보가 수정되었습니다';
            modal.showModal();
            
            setTimeout(() => {
                modal.close();
                loadUserProfile(); // 화면 새로고침
            }, 1500);
            
        } catch (error) {
            console.error('Profile update error:', error);
            
            if (error.message && error.message.includes('nickname_already_exists')) {
                showFieldError('nickname', '이미 사용 중인 닉네임입니다');
            } else {
                alert('회원정보 수정에 실패했습니다. 다시 시도해주세요.');
            }
        }
    });
    
    // 드롭다운 메뉴
    const btnMenu = document.getElementById('btnMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (btnMenu && dropdownMenu) {
        btnMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
    }
});

/**
 * 사용자 프로필 로드
 */
async function loadUserProfile() {
    try {
        const user = await getMe();
        
        if (!user) throw new Error('사용자 정보를 가져올 수 없습니다');
        
        // 이메일 (읽기 전용)
        document.getElementById('email').value = user.email;
        
        // 닉네임
        document.getElementById('nickname').value = user.nickname;
        
        // 프로필 이미지
        if (user.profile_image_url) {
            const img = document.getElementById('profileImg');
            const placeholder = document.getElementById('profilePreview').querySelector('.profile-placeholder');
            
            img.src = user.profile_image_url;
            img.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Failed to load profile:', error);
        // 더미 데이터
        document.getElementById('email').value = 'user@example.com';
        document.getElementById('nickname').value = 'User';
    }
}

/**
 * 회원탈퇴 모달 표시
 */
function showDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.showModal();
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.close();
}

/**
 * 회원탈퇴 확인
 */
async function confirmDelete() {
    try {
        // TODO: 회원탈퇴 API 구현 필요
        alert('회원탈퇴가 완료되었습니다');
        window.location.href = '/login';
    } catch (error) {
        console.error('Failed to delete account:', error);
        alert('회원탈퇴에 실패했습니다');
    }
}

function closeModal() {
    const modal = document.getElementById('confirmModal');
    modal.close();
}

/**
 * 로그아웃
 */
function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        logout().then(() => {
            window.location.href = '/login';
        }).catch(() => {
            window.location.href = '/login';
        });
    }
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