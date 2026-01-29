/**
 * 게시글 수정 페이지 로직
 */

(function() {
    let currentPostId = null;
    let uploadedImageFile = null;
    let existingImageUrl = null;
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ 게시글 수정 페이지 로드');
        
        // URL에서 게시글 ID 추출
        const pathParts = window.location.pathname.split('/');
        currentPostId = pathParts[2]; // /posts/:id/edit
        
        if (!currentPostId) {
            alert('게시글 ID를 찾을 수 없습니다.');
            window.location.href = '/posts';
            return;
        }
        
        console.log('📝 수정할 게시글 ID:', currentPostId);
        
        // 기존 게시글 데이터 로드
        loadPostData();
        
        // DOM 요소
        const form = document.getElementById('editForm');
        const btnBack = document.getElementById('btnBack');
        const imageInput = document.getElementById('image');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const imageLabel = document.getElementById('imageLabel');
        const currentImageName = document.getElementById('currentImageName');
        const btnRemoveImage = document.getElementById('btnRemoveImage');
        const confirmModal = document.getElementById('confirmModal');
        const btnConfirmModal = document.getElementById('btnConfirmModal');
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const submitButton = document.getElementById('btnSubmit');
        
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
        
        // 뒤로가기 버튼
        if (btnBack) {
            btnBack.addEventListener('click', function() {
                history.back();
            });
        }
        
        // 제목, 내용 입력 시 버튼 색상 변경
        function checkFormValid() {
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            
            if (title && content) {
                submitButton.style.background = '#7F6AEE';
            } else {
                submitButton.style.background = '#ACA0EB';
            }
        }
        
        titleInput.addEventListener('input', checkFormValid);
        contentInput.addEventListener('input', checkFormValid);
        
        // 이미지 선택
        if (imageInput) {
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
                existingImageUrl = null; // 새 이미지로 대체
                
                // 미리보기
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImg) previewImg.src = e.target.result;
                    if (imagePreview) imagePreview.style.display = 'block';
                    if (imageLabel) imageLabel.textContent = '파일 선택';
                    if (currentImageName) currentImageName.textContent = file.name;
                };
                reader.readAsDataURL(file);
            });
        }
        
        // 이미지 제거 버튼
        if (btnRemoveImage) {
            btnRemoveImage.addEventListener('click', function() {
                removeImage();
            });
        }
        
        // 모달 확인 버튼
        if (btnConfirmModal) {
            btnConfirmModal.addEventListener('click', function() {
                // 게시글 상세 페이지로 이동
                window.location.href = `/posts/${currentPostId}`;
            });
        }
        
        // 폼 제출
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const title = titleInput.value.trim();
                const content = contentInput.value.trim();
                
                // 검증
                if (!title) {
                    alert('제목을 입력해주세요.');
                    return;
                }
                
                if (title.length > 26) {
                    alert('제목은 26자 이하로 입력해주세요.');
                    return;
                }
                
                if (!content) {
                    alert('내용을 입력해주세요.');
                    return;
                }
                
                try {
                    let imageUrl = existingImageUrl;
                    
                    // 새 이미지 업로드 (있는 경우)
                    if (uploadedImageFile) {
                        console.log('📤 이미지 업로드 중...');
                        const uploadResult = await uploadImage(uploadedImageFile, 'post');
                        imageUrl = uploadResult.data?.image_url || uploadResult.image_url;
                        console.log('✅ 이미지 업로드 완료:', imageUrl);
                    }
                    
                    // 게시글 수정 API 호출
                    console.log('📤 게시글 수정 요청:', { title, content, imageUrl });
                    await updatePost(currentPostId, title, content, imageUrl);
                    
                    console.log('✅ 게시글 수정 성공');
                    
                    // 성공 모달 표시
                    if (confirmModal) {
                        confirmModal.style.display = 'flex';
                    }
                    
                } catch (error) {
                    console.error('❌ 게시글 수정 실패:', error);
                    alert('게시글 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
                }
            });
        }
    });
    
    /**
     * 기존 게시글 데이터 로드
     */
    async function loadPostData() {
        try {
            console.log('📥 게시글 데이터 로드 중...');
            
            const response = await getPost(currentPostId);
            const post = response.data || response;
            
            console.log('✅ 게시글 데이터:', post);
            
            // 입력 필드에 기존 데이터 설정
            const titleInput = document.getElementById('title');
            const contentInput = document.getElementById('content');
            const imagePreview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            const currentImageName = document.getElementById('currentImageName');
            const submitButton = document.getElementById('btnSubmit');
            
            if (titleInput) titleInput.value = post.title || '';
            if (contentInput) contentInput.value = post.content || '';
            
            // 기존 이미지가 있는 경우
            if (post.image_url) {
                existingImageUrl = post.image_url;
                
                let imageUrl = post.image_url;
                if (imageUrl.startsWith('/')) {
                    imageUrl = `http://localhost:8000${imageUrl}`;
                }
                
                if (previewImg) previewImg.src = imageUrl;
                if (imagePreview) imagePreview.style.display = 'block';
                if (currentImageName) currentImageName.textContent = '기존 파일 있음';
            }
            
            // 버튼 색상 업데이트
            if (post.title && post.content && submitButton) {
                submitButton.style.background = '#7F6AEE';
            }
            
        } catch (error) {
            console.error('❌ 게시글 로드 실패:', error);
            alert('게시글을 불러오는데 실패했습니다.');
            window.location.href = '/posts';
        }
    }
    
    /**
     * 이미지 제거
     */
    function removeImage() {
        uploadedImageFile = null;
        existingImageUrl = null;
        
        const imageInput = document.getElementById('image');
        const imagePreview = document.getElementById('imagePreview');
        const imageLabel = document.getElementById('imageLabel');
        const currentImageName = document.getElementById('currentImageName');
        
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (imageLabel) imageLabel.textContent = '파일 선택';
        if (currentImageName) currentImageName.textContent = '';
    }
    
    /**
     * 로그아웃
     */
    window.handleLogout = function() {
        if (confirm('로그아웃 하시겠습니까?')) {
            logout().then(() => {
                window.location.href = '/login';
            }).catch(() => {
                window.location.href = '/login';
            });
        }
    };
})();
