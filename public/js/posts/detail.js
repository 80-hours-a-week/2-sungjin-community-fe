let currentPostId = null;
let currentCommentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const isReady = await ensureAuthenticated();
    if (!isReady) return;

    const pathParts = window.location.pathname.split('/');
    currentPostId = pathParts[pathParts.length - 1];

    bindHeaderMenu();
    bindActionButtons();
    bindModalEvents();
    bindCommentDelegation();

    await Promise.all([
        loadHeaderProfile(),
        loadPostDetail(),
        loadComments()
    ]);
});

function bindHeaderMenu() {
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

function bindActionButtons() {
    const btnEditPost = document.getElementById('btnEditPost');
    const btnDeletePost = document.getElementById('btnDeletePost');
    const likeButton = document.getElementById('likeButton');
    const btnSubmitComment = document.getElementById('btnSubmitComment');

    if (btnEditPost) btnEditPost.addEventListener('click', () => navigateTo(`/posts/${currentPostId}/edit`));
    if (btnDeletePost) btnDeletePost.addEventListener('click', showDeleteModal);
    if (likeButton) likeButton.addEventListener('click', toggleLike);
    if (btnSubmitComment) btnSubmitComment.addEventListener('click', submitComment);
}

function bindModalEvents() {
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmCommentModal = document.getElementById('btnConfirmCommentModal');
    const btnCancelCommentModal = document.getElementById('btnCancelCommentModal');

    if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', confirmDeletePost);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    if (btnConfirmCommentModal) btnConfirmCommentModal.addEventListener('click', confirmDeleteComment);
    if (btnCancelCommentModal) btnCancelCommentModal.addEventListener('click', closeCommentModal);

    ['deleteModal', 'commentModal'].forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function bindCommentDelegation() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    commentsList.addEventListener('click', (event) => {
        const editButton = event.target.closest('.btn-comment-edit');
        const deleteButton = event.target.closest('.btn-comment-delete');

        if (editButton) {
            editComment(editButton.dataset.id);
        }

        if (deleteButton) {
            showDeleteCommentModal(deleteButton.dataset.id);
        }
    });
}

async function loadHeaderProfile() {
    try {
        const response = await getMe();
        const user = response && response.data ? response.data : response;
        const headerImage = document.getElementById('headerProfileImage');

        if (!headerImage) return;
        headerImage.src = resolveImageUrl(user && user.profile_image_url, '/images/default-profile.png');
        headerImage.onerror = function onHeaderImageError() {
            this.src = '/images/default-profile.png';
        };
    } catch (error) {
        console.debug('Failed to load header profile image:', error.message);
    }
}

async function loadPostDetail() {
    try {
        const response = await getPost(currentPostId);
        const post = response && response.data ? response.data : response;

        if (!post || !post.title) {
            throw new Error('게시글을 찾을 수 없습니다.');
        }

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postBody').textContent = post.content || '';
        document.getElementById('authorName').textContent = post.author_nickname || '익명';
        document.getElementById('postDate').textContent = formatDate(post.created_at || new Date().toISOString());

        const authorImage = document.getElementById('authorImage');
        if (authorImage) {
            authorImage.src = resolveImageUrl(post.author_profile_image, '/images/default-profile.png');
            authorImage.onerror = function onAuthorImageError() {
                this.src = '/images/default-profile.png';
            };
        }

        const postImage = document.getElementById('postImage');
        if (postImage && post.image_url) {
            postImage.innerHTML = `<img src="${escapeHtml(resolveImageUrl(post.image_url))}" alt="게시글 이미지">`;
            postImage.style.display = 'block';
        }

        document.getElementById('viewCount').textContent = formatStatCount(post.view_count || post.views || 0);
        document.getElementById('likeCount').textContent = formatStatCount(post.likes_count || 0);
        document.getElementById('commentCount').textContent = formatStatCount(post.comments_count || 0);

        const likeButton = document.getElementById('likeButton');
        const likeText = document.getElementById('likeText');
        if (post.is_liked && likeButton && likeText) {
            likeButton.classList.add('active');
            likeText.textContent = '좋아요 취소';
        }

        const postActions = document.getElementById('postActions');
        if (post.is_author && postActions) {
            postActions.style.display = 'flex';
        }
    } catch (error) {
        handleApiError(error, {
            fallbackMessage: '게시글을 불러오지 못했습니다.'
        });
        navigateTo('/posts');
    }
}

async function loadComments() {
    const container = document.getElementById('commentsList');
    if (!container) return;

    try {
        const response = await getComments(currentPostId);
        const comments = extractComments(response);
        renderComments(comments, container);
    } catch (error) {
        container.innerHTML = '<div class="loading">댓글을 불러오지 못했습니다.</div>';
        handleApiError(error, {
            fallbackMessage: '댓글을 불러오는 중 오류가 발생했습니다.'
        });
    }
}

function extractComments(response) {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response)) return response;
    return [];
}

function renderComments(comments, container) {
    if (!comments.length) {
        container.innerHTML = '<div class="loading">댓글이 없습니다.</div>';
        return;
    }

    container.innerHTML = '';

    comments.forEach((comment) => {
        const isMyComment = Boolean(comment.is_author);
        const item = document.createElement('div');
        item.className = 'comment-item';

        item.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <img
                        src="${escapeHtml(resolveImageUrl(comment.author_profile_image, '/images/default-profile.png'))}"
                        alt="프로필"
                        class="comment-avatar"
                        onerror="this.src='/images/default-profile.png'"
                    >
                    <div>
                        <div class="comment-name">${escapeHtml(comment.author_nickname || '익명')}</div>
                        <div class="comment-time">${escapeHtml(formatDate(comment.created_at || new Date().toISOString()))}</div>
                    </div>
                </div>
                ${isMyComment ? `
                    <div class="comment-actions">
                        <button class="btn-comment-edit" data-id="${comment.id}">수정</button>
                        <button class="btn-comment-delete" data-id="${comment.id}">삭제</button>
                    </div>
                ` : ''}
            </div>
            <div class="comment-content">${escapeHtml(comment.content || '')}</div>
        `;

        container.appendChild(item);
    });
}

async function submitComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();

    if (!content) {
        showToast('댓글 내용을 입력해 주세요.');
        return;
    }

    try {
        await createComment(currentPostId, content);
        input.value = '';
        await loadComments();

        const commentCount = document.getElementById('commentCount');
        commentCount.textContent = String(Number(commentCount.textContent || 0) + 1);
    } catch (error) {
        handleApiError(error, {
            fallbackMessage: '댓글 작성에 실패했습니다.'
        });
    }
}

async function editComment(commentId) {
    const newContent = window.prompt('댓글 내용을 수정해 주세요.');
    if (!newContent || !newContent.trim()) return;

    try {
        await updateComment(currentPostId, commentId, newContent.trim());
        await loadComments();
    } catch (error) {
        handleApiError(error, {
            fallbackMessage: '댓글 수정에 실패했습니다.'
        });
    }
}

function showDeleteCommentModal(commentId) {
    currentCommentId = commentId;
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'flex';
}

async function confirmDeleteComment() {
    if (!currentCommentId) return;

    try {
        await deleteComment(currentPostId, currentCommentId);
        closeCommentModal();
        await loadComments();

        const commentCount = document.getElementById('commentCount');
        commentCount.textContent = String(Math.max(0, Number(commentCount.textContent || 0) - 1));
    } catch (error) {
        handleApiError(error, {
            fallbackMessage: '댓글 삭제에 실패했습니다.'
        });
    }
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) modal.style.display = 'none';
    currentCommentId = null;
}

function showDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'flex';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.style.display = 'none';
}

async function confirmDeletePost() {
    try {
        await deletePost(currentPostId);
        showToast('게시글이 삭제되었습니다.');
        navigateTo('/posts');
    } catch (error) {
        closeDeleteModal();
        handleApiError(error, {
            fallbackMessage: '게시글 삭제에 실패했습니다.'
        });
    }
}

async function toggleLike() {
    const button = document.getElementById('likeButton');
    const text = document.getElementById('likeText');
    const count = document.getElementById('likeCount');

    const isLiked = button.classList.contains('active');

    try {
        if (isLiked) {
            await unlikePost(currentPostId);
            button.classList.remove('active');
            text.textContent = '좋아요';
            count.textContent = String(Math.max(0, Number(count.textContent || 0) - 1));
        } else {
            await likePost(currentPostId);
            button.classList.add('active');
            text.textContent = '좋아요 취소';
            count.textContent = String(Number(count.textContent || 0) + 1);
        }
    } catch (error) {
        handleApiError(error, {
            fallbackMessage: '좋아요 처리에 실패했습니다.'
        });
    }
}

function resolveImageUrl(imageUrl, fallback = '') {
    if (!imageUrl) return fallback;
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return typeof toApiUrl === 'function' ? toApiUrl(imageUrl) : imageUrl;
}
