/**
 * Post write page script
 */
(function initWritePage() {
    let uploadedImageFile = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const isReady = await ensureAuthenticated();
        if (!isReady) return;

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
        const tagsInput = document.getElementById('tags');
        const submitButton = form.querySelector('button[type="submit"]');
        const helperText = document.getElementById('formHelper');

        submitButton.style.background = '#ACA0EB';

        if (titleInput) {
            titleInput.maxLength = 26;
            titleInput.addEventListener('input', () => {
                if (titleInput.value.length > 26) {
                    titleInput.value = titleInput.value.slice(0, 26);
                }
                validateAndUpdateButton();
            });
        }

        if (contentInput) {
            contentInput.addEventListener('input', validateAndUpdateButton);
        }

        function validateAndUpdateButton() {
            const title = titleInput ? titleInput.value.trim() : '';
            const content = contentInput ? contentInput.value.trim() : '';

            if (title && content) {
                submitButton.style.background = '#7F6AEE';
                if (helperText) helperText.style.display = 'none';
            } else {
                submitButton.style.background = '#ACA0EB';
                if (helperText) helperText.style.display = 'block';
            }
        }

        if (btnBack) {
            btnBack.addEventListener('click', () => history.back());
        }

        if (imageInput) {
            imageInput.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;

                if (file.size > 5 * 1024 * 1024) {
                    showToast('이미지 크기는 5MB 이하여야 합니다.');
                    imageInput.value = '';
                    return;
                }

                if (!file.type.startsWith('image/')) {
                    showToast('이미지 파일만 업로드 가능합니다.');
                    imageInput.value = '';
                    return;
                }

                uploadedImageFile = file;
                const reader = new FileReader();
                reader.onload = (readEvent) => {
                    if (previewImg) previewImg.src = readEvent.target.result;
                    if (imagePreview) imagePreview.style.display = 'block';
                    if (imageLabel) imageLabel.textContent = file.name;
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveImage) {
            btnRemoveImage.addEventListener('click', removeImage);
        }

        if (btnConfirmModal) {
            btnConfirmModal.addEventListener('click', () => {
                window.location.href = '/posts';
            });
        }

        if (form) {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const title = titleInput.value.trim();
                const content = contentInput.value.trim();
                const tags = parseTagsInput(tagsInput ? tagsInput.value : '');

                if (!title) {
                    showToast('제목을 입력해 주세요.');
                    return;
                }

                if (!content) {
                    showToast('내용을 입력해 주세요.');
                    return;
                }

                submitButton.disabled = true;

                try {
                    let imageUrl = null;

                    if (uploadedImageFile) {
                        const uploadResult = await uploadImage(uploadedImageFile, 'post');
                        imageUrl = uploadResult && uploadResult.data
                            ? uploadResult.data.image_url
                            : uploadResult.image_url;
                    }

                    await createPost(title, content, imageUrl, tags);

                    if (confirmModal) {
                        confirmModal.style.display = 'flex';
                    }
                } catch (error) {
                    handleApiError(error, {
                        fallbackMessage: '게시글 작성에 실패했습니다.'
                    });
                } finally {
                    submitButton.disabled = false;
                }
            });
        }
    });

    function removeImage() {
        uploadedImageFile = null;

        const imageInput = document.getElementById('image');
        const imagePreview = document.getElementById('imagePreview');
        const imageLabel = document.getElementById('imageLabel');

        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.style.display = 'none';
        if (imageLabel) imageLabel.textContent = '파일을 선택해 주세요';
    }

    function parseTagsInput(value) {
        if (!value) return [];

        const tags = value
            .split(',')
            .map((tag) => tag.trim().replace(/^#/, ''))
            .filter(Boolean);

        return [...new Set(tags)].slice(0, 10);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { parseTagsInput };
    }
})();
