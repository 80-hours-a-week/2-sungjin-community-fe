/**
 * 게시글 작성 페이지 로직 - 완전 구현
 */

let uploadedImageFile = null;
let uploadedImageUrl = null;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('writeForm');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const imageInput = document.getElementById('image');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // 실시간 검증 및 버튼 색상 변경
    titleInput.addEventListener('input', function() {
        validateAndUpdateButton();
        updateCharacterCount();
    });
    contentInput.addEventListener('input', validateAndUpdateButton);
    
    // 이미지 선택
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('이미지 크기는 5MB 이하여야 합니다.');
            imageInput.value = '';
            return;
        }
        
        // 파일 타입 체크
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            imageInput.value = '';
            return;
        }
        
        uploadedImageFile = file;
        
        // 미리보기 표시
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            
            previewImg.src = e.target.result;
            preview.style.display = 'block';
            
            // 파일명 표시
            document.getElementById('imageLabel').textContent = file.name;
        };
        reader.readAsDataURL(file);
    });
    
    // 폼 제출
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 에러 초기화
        hideFieldError('title');
        hideFieldError('content');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        // 검증
        let isValid = true;
        
        if (!title) {
            showFieldError('title', '제목을 입력해주세요');
            isValid = false;
        } else if (title.length > 26) {
            showFieldError('title', '제목은 최대 26자까지 작성 가능합니다');
            isValid = false;
        }
        
        if (!content) {
            showFieldError('content', '내용을 입력해주세요');
            isValid = false;
        }
        
        if (!isValid) return;
        
        try {
            // 1. 이미지 업로드 (있는 경우)
            if (uploadedImageFile) {
                try {
                    const uploadResult = await uploadImage(uploadedImageFile, 'post');
                    uploadedImageUrl = uploadResult.data.image_url;
                } catch (uploadError) {
                    console.log('이미지 업로드 실패 (선택사항이므로 계속 진행)');
                }
            }
            
            // 2. 게시글 작성 API 호출
            const response = await createPost(title, content, uploadedImageUrl);
            
            // 성공 모달 표시
            const modal = document.getElementById('confirmModal');
            modal.showModal();
            
        } catch (error) {
            console.error('Create post error:', error);
            alert('게시글 작성에 실패했습니다. 다시 시도해주세요.');
        }
    });
    
    /**
     * 실시간 검증 및 버튼 색상 변경
     */
    function validateAndUpdateButton() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        // 제목과 내용이 모두 입력되었는지 확인
        if (title && content) {
            // 모두 입력됨 - 버튼 색상 변경 (ACA0EB → 7F6AEE)
            submitButton.style.background = '#7F6AEE';
        } else {
            // 입력 안됨 - 원래 색상
            submitButton.style.background = '#ACA0EB';
        }
    }
    
    /**
     * 제목 글자수 표시 (26자 제한)
     */
    function updateCharacterCount() {
        const title = titleInput.value;
        const count = title.length;
        
        // Helper text 업데이트 (있는 경우)
        const helper = titleInput.parentElement.querySelector('.form-helper');
        if (helper) {
            if (count > 26) {
                helper.textContent = `제목은 최대 26자까지 작성 가능합니다 (${count}/26)`;
                helper.style.color = 'var(--danger)';
            } else {
                helper.textContent = `${count}/26자`;
                helper.style.color = 'var(--gray-500)';
            }
        }
    }
});

function removeImage() {
    uploadedImageFile = null;
    uploadedImageUrl = null;
    
    const imageInput = document.getElementById('image');
    const preview = document.getElementById('imagePreview');
    
    imageInput.value = '';
    preview.style.display = 'none';
    document.getElementById('imageLabel').textContent = '파일을 선택해주세요';
}

function goToPosts() {
    const modal = document.getElementById('confirmModal');
    modal.close();
    window.location.href = '/posts';
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