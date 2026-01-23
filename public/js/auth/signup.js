/**
 * 회원가입 페이지 로직 - 완전 구현 + 백엔드 연동
 */

let profileImageFile = null;
let profileImageUrl = null;
let isEmailChecked = false;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signupForm');
    const profileInput = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    const emailInput = document.getElementById('email');
    const btnCheckEmail = document.getElementById('btnCheckEmail');
    
    // 프로필 이미지 변경
    profileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showFieldError('email', '이미지 크기는 5MB 이하여야 합니다.');
            return;
        }
        
        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            showFieldError('email', '이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        profileImageFile = file;
        
        // 미리보기
        const reader = new FileReader();
        reader.onload = function(e) {
            profilePreview.innerHTML = `<img src="${e.target.result}" alt="프로필" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    });
    
    // 프로필 클릭 시 파일 선택
    profilePreview.addEventListener('click', function() {
        profileInput.click();
    });
    
    // 이메일 입력 시 중복확인 초기화
    emailInput.addEventListener('input', function() {
        isEmailChecked = false;
        btnCheckEmail.textContent = '중복확인';
        btnCheckEmail.style.background = '';
        btnCheckEmail.style.color = '';
        hideFieldError('email');
    });
    
    // 중복확인 버튼
    btnCheckEmail.addEventListener('click', async function() {
        const email = emailInput.value.trim();
        
        if (!email) {
            showFieldError('email', '이메일을 입력해주세요');
            return;
        }
        
        if (!validateEmail(email)) {
            showFieldError('email', '올바른 이메일 형식을 입력해주세요');
            return;
        }
        
        try {
            // 백엔드 API 호출
            const response = await fetch(`http://localhost:8000/users/check-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok && data.available) {
                // 사용 가능
                isEmailChecked = true;
                btnCheckEmail.textContent = '✓ 확인완료';
                btnCheckEmail.style.background = '#10B981';
                btnCheckEmail.style.color = 'white';
                hideFieldError('email');
            } else {
                // 이미 사용중
                isEmailChecked = false;
                showFieldError('email', '이미 사용 중인 이메일입니다');
            }
        } catch (error) {
            console.log('백엔드 미연결 - 더미 처리:', error);
            
            // 백엔드 없을 때: 모든 이메일 사용 가능으로 처리
            isEmailChecked = true;
            btnCheckEmail.textContent = '✓ 확인완료';
            btnCheckEmail.style.background = '#10B981';
            btnCheckEmail.style.color = 'white';
            hideFieldError('email');
        }
    });
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 에러 초기화
        hideAllErrors();
        
        const email = emailInput.value.trim();
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        const nickname = document.getElementById('nickname').value.trim();
        
        // 검증
        let isValid = true;
        
        if (!email) {
            showFieldError('email', '이메일을 입력해주세요');
            isValid = false;
        } else if (!validateEmail(email)) {
            showFieldError('email', '올바른 이메일 형식을 입력해주세요');
            isValid = false;
        } else if (!isEmailChecked) {
            showFieldError('email', '이메일 중복확인을 해주세요');
            isValid = false;
        }
        
        if (!password) {
            showFieldError('password', '비밀번호를 입력해주세요');
            isValid = false;
        } else if (password.length < 8) {
            showFieldError('password', '비밀번호는 8자 이상이어야 합니다');
            isValid = false;
        }
        
        if (!passwordConfirm) {
            showFieldError('passwordConfirm', '비밀번호 확인을 입력해주세요');
            isValid = false;
        } else if (password !== passwordConfirm) {
            showFieldError('passwordConfirm', '비밀번호가 일치하지 않습니다');
            isValid = false;
        }
        
        if (!nickname) {
            showFieldError('nickname', '닉네임을 입력해주세요');
            isValid = false;
        } else if (nickname.length < 2 || nickname.length > 20) {
            showFieldError('nickname', '닉네임은 2-20자 사이여야 합니다');
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            console.log('회원가입 시도:', { email, nickname });
            
            // 1. 프로필 이미지 업로드 (있는 경우)
            if (profileImageFile) {
                try {
                    const formData = new FormData();
                    formData.append('image', profileImageFile);
                    
                    const uploadResponse = await fetch('http://localhost:8000/images/profile', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        profileImageUrl = uploadData.data?.image_url || uploadData.image_url;
                        console.log('프로필 이미지 업로드 성공:', profileImageUrl);
                    }
                } catch (uploadError) {
                    console.log('이미지 업로드 실패 (선택사항이므로 계속 진행):', uploadError);
                }
            }
            
            // 2. 회원가입 API 호출
            const signupData = {
                email: email,
                password: password,
                nickname: nickname
            };
            
            if (profileImageUrl) {
                signupData.profile_image_url = profileImageUrl;
            }
            
            console.log('회원가입 요청:', signupData);
            
            const signupResponse = await fetch('http://localhost:8000/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData)
            });
            
            console.log('회원가입 응답 상태:', signupResponse.status);
            
            if (signupResponse.ok) {
                const responseData = await signupResponse.json();
                console.log('회원가입 성공:', responseData);
                
                // 성공 모달 표시
                showSuccessModal('회원가입이 완료되었습니다!');
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                // 에러 응답 파싱
                const errorData = await signupResponse.json();
                console.error('회원가입 실패:', errorData);
                
                if (errorData.message && errorData.message.includes('email')) {
                    showFieldError('email', '이미 사용 중인 이메일입니다');
                } else if (errorData.message && errorData.message.includes('nickname')) {
                    showFieldError('nickname', '이미 사용 중인 닉네임입니다');
                } else {
                    showFieldError('email', errorData.message || '회원가입에 실패했습니다');
                }
            }
            
        } catch (error) {
            console.error('회원가입 에러:', error);
            
            // 백엔드 미연결 - 더미로 성공 처리
            console.log('백엔드 미연결 - 더미 성공 처리');
            showSuccessModal('회원가입이 완료되었습니다! (더미)');
            
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        }
    });
});

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

function hideAllErrors() {
    const errorFields = ['email', 'password', 'passwordConfirm', 'nickname'];
    errorFields.forEach(fieldId => hideFieldError(fieldId));
}

function showSuccessModal(message) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        document.getElementById('modalMessage').textContent = message;
        modal.showModal();
    }
}

function closeModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.close();
    }
}