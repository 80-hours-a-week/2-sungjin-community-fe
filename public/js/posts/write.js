/**
 * 게시글 작성 페이지 로직
 */

// IIFE로 전역 스코프 오염 방지
(function () {
    let uploadedImageFile = null;

    document.addEventListener('DOMContentLoaded', function () {
        console.log('✅ 게시글 작성 페이지 로드');

        // DOM 요소
        const form = document.getElementById('writeForm');
        const btnBack = document.getElementById('btnBack');
        const imageInput = document.getElementById('image');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const imageLabel = document.getElementById('imageLabel');
        const btnRemoveImage = document.getElementById('btnRemoveImage');
        const confirmModal = document.getElementById('confirmModal');
        const btnConfirmModal = document.getElementById('btnConfirmModal');
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const submitButton = form.querySelector('button[type="submit"]');
        const helperText = document.getElementById('formHelper');

        // 초기 버튼 상태
        if (submitButton) {
            submitButton.style.background = '#ACA0EB';
        }

        // 제목 입력 제한 (26자)
        if (titleInput) {
            titleInput.maxLength = 26;
            titleInput.addEventListener('input', function () {
                if (this.value.length > 26) {
                    this.value = this.value.substring(0, 26);
                }
                validateAndUpdateButton();
            });
        }

        // 내용 입력 핸들러
        if (contentInput) {
            contentInput.addEventListener('input', validateAndUpdateButton);
        }

        // 버튼 활성화 검사
        function validateAndUpdateButton() {
            const title = titleInput ? titleInput.value.trim() : '';
            const content = contentInput ? contentInput.value.trim() : '';

            if (title && content) {
                submitButton.style.background = '#7F6AEE';
                if (helperText) helperText.style.display = 'none';
            } else {
                submitButton.style.background = '#ACA0EB';
            }
        }

        // ✅ 뒤로가기 버튼
        if (btnBack) {
            btnBack.addEventListener('click', function () {
                history.back();
            });
        }

        // 이미지 선택
        if (imageInput) {
            imageInput.addEventListener('change', function (e) {
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

                // 미리보기
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (previewImg) previewImg.src = e.target.result;
                    if (imagePreview) imagePreview.style.display = 'block';
                    if (imageLabel) imageLabel.textContent = file.name;
                };
                reader.readAsDataURL(file);
            });
        }

        // ✅ 이미지 제거 버튼
        if (btnRemoveImage) {
            btnRemoveImage.addEventListener('click', function () {
                removeImage();
            });
        }

        // ✅ 모달 확인 버튼
        if (btnConfirmModal) {
            btnConfirmModal.addEventListener('click', function () {
                goToPosts();
            });
        }

        // 폼 제출
        if (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                const title = document.getElementById('title').value.trim();
                const content = document.getElementById('content').value.trim();

                // 검증
                if (!title) {
                    alert('제목을 입력해주세요.');
                    return;
                }

                if (!content) {
                    alert('내용을 입력해주세요.');
                    return;
                }

                try {
                    let imageUrl = null;

                    // 이미지 업로드 (있는 경우)
                    if (uploadedImageFile) {
                        const uploadResult = await uploadImage(uploadedImageFile, 'post');
                        imageUrl = uploadResult.data?.image_url || uploadResult.image_url;
                    }

                    // 게시글 작성 API 호출
                    await createPost(title, content, imageUrl);

                    // 성공 모달 표시
                    if (confirmModal) {
                        confirmModal.style.display = 'flex';
                    }

                } catch (error) {
                    console.error('게시글 작성 실패:', error);
                    alert('게시글 작성에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
                }
            });
        }
    });

    // ✅ 이미지 제거 함수
    function removeImage() {
        uploadedImageFile = null;

        const imageInput = document.getElementById('image');
        const imagePreview = document.getElementById('imagePreview');
        const imageLabel = document.getElementById('imageLabel');

        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (imageLabel) imageLabel.textContent = '파일을 선택해주세요';
    }

    // ✅ 게시글 목록으로 이동
    function goToPosts() {
        window.location.href = `/posts?t=${Date.now()}`;
    }
})();