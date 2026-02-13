/**
 * Post edit page script
 */
(function initEditPostPage() {
    let currentPostId = null;
    let uploadedImageFile = null;
    let existingImageUrl = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const isReady = await ensureAuthenticated();
        if (!isReady) return;

        const pathParts = window.location.pathname.split('/');
        currentPostId = pathParts[2]; // /posts/:id/edit

        if (!currentPostId) {
            showToast('게시글 ID를 확인할 수 없습니다.');
            navigateTo('/posts');
            return;
        }

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
        const tagsInput = document.getElementById('tags');
        const submitButton = document.getElementById('btnSubmit');

        bindDropdownMenu();
        bindHeaderEvents();
        await loadPostData();
        checkFormValid();

        function bindHeaderEvents() {
            if (btnBack) {
                btnBack.addEventListener('click', () => history.back());
            }

            titleInput.addEventListener('input', checkFormValid);
            contentInput.addEventListener('input', checkFormValid);
        }

        function checkFormValid() {
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            submitButton.style.background = title && content ? '#7F6AEE' : '#ACA0EB';
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
                existingImageUrl = null;

                const reader = new FileReader();
                reader.onload = (readEvent) => {
                    if (previewImg) previewImg.src = readEvent.target.result;
                    if (imagePreview) imagePreview.style.display = 'block';
                    if (imageLabel) imageLabel.textContent = '파일 선택';
                    if (currentImageName) currentImageName.textContent = file.name;
                };
                reader.readAsDataURL(file);
            });
        }

        if (btnRemoveImage) {
            btnRemoveImage.addEventListener('click', removeImage);
        }

        if (btnConfirmModal) {
            btnConfirmModal.addEventListener('click', () => {
                navigateTo(`/posts/${currentPostId}`);
            });
        }

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
                let nextImageUrl = existingImageUrl;

                if (uploadedImageFile) {
                    const uploadResult = await uploadImage(uploadedImageFile, 'post');
                    nextImageUrl = uploadResult && uploadResult.data
                        ? uploadResult.data.image_url
                        : uploadResult.image_url;
                }

                await updatePost(currentPostId, title, content, nextImageUrl, tags);

                if (confirmModal) {
                    confirmModal.style.display = 'flex';
                }
            } catch (error) {
                handleApiError(error, {
                    fallbackMessage: '게시글 수정에 실패했습니다.'
                });
            } finally {
                submitButton.disabled = false;
            }
        });
    });

    async function loadPostData() {
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const tagsInput = document.getElementById('tags');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const currentImageName = document.getElementById('currentImageName');

        try {
            const response = await getPost(currentPostId);
            const post = response && response.data ? response.data : response;

            titleInput.value = post.title || '';
            contentInput.value = post.content || '';
            tagsInput.value = normalizePostTags(post.tags).join(', ');

            if (post.image_url) {
                existingImageUrl = post.image_url;
                if (previewImg) previewImg.src = resolveImageUrl(post.image_url);
                if (imagePreview) imagePreview.style.display = 'block';
                if (currentImageName) currentImageName.textContent = '기존 이미지';
            }
        } catch (error) {
            handleApiError(error, {
                fallbackMessage: '게시글을 불러오지 못했습니다.'
            });
            navigateTo('/posts');
        }
    }

    function bindDropdownMenu() {
        const btnMenu = document.getElementById('btnMenu');
        const dropdownMenu = document.getElementById('dropdownMenu');

        if (!btnMenu || !dropdownMenu) return;

        btnMenu.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }

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

    function parseTagsInput(value) {
        if (!value) return [];
        const tags = value
            .split(',')
            .map((tag) => tag.trim().replace(/^#/, ''))
            .filter(Boolean);
        return [...new Set(tags)].slice(0, 10);
    }

    function normalizePostTags(tags) {
        if (!Array.isArray(tags)) return [];
        return [...new Set(tags
            .map((tag) => String(tag || '').trim().replace(/^#/, ''))
            .filter(Boolean)
        )];
    }

    function resolveImageUrl(imageUrl) {
        if (!imageUrl) return '';
        if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
        return typeof toApiUrl === 'function' ? toApiUrl(imageUrl) : imageUrl;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { parseTagsInput, normalizePostTags };
    }
})();
