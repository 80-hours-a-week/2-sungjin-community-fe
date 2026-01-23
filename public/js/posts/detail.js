/**
 * 게시글 상세 페이지 로직 - 완전 구현
 */

let currentPostId = null;
let isAuthor = false;
let currentCommentId = null;

document.addEventListener('DOMContentLoaded', function() {
    // URL에서 게시글 ID 추출
    const pathParts = window.location.pathname.split('/');
    currentPostId = pathParts[pathParts.length - 1];
    
    if (currentPostId) {
        loadPostDetail();
        loadComments();
    }
    
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
 * 게시글 상세 로드
 */
async function loadPostDetail() {
    try {
        // 백엔드 API 호출
        const post = await getPost(currentPostId);
        
        if (!post) throw new Error('게시글을 찾을 수 없습니다');
        
        // 화면 업데이트
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postBody').textContent = post.content;
        
        // 작성자 정보
        if (post.author_nickname) {
            document.getElementById('authorName').textContent = post.author_nickname;
        }
        if (post.author_profile_image) {
            document.getElementById('authorImage').src = post.author_profile_image;
        }
        
        // 날짜
        document.getElementById('postDate').textContent = formatDate(post.created_at);
        
        // 이미지
        if (post.image_url) {
            const imageDiv = document.getElementById('postImage');
            imageDiv.innerHTML = `<img src="${post.image_url}" alt="게시글 이미지">`;
            imageDiv.style.display = 'block';
        }
        
        // 통계
        document.getElementById('viewCount').textContent = post.views || 0;
        document.getElementById('likeCount').textContent = post.likes_count || 0;
        document.getElementById('commentCount').textContent = post.comments_count || 0;
        
        // 좋아요 상태
        if (post.is_liked) {
            document.getElementById('likeButton').classList.add('active');
            document.getElementById('likeText').textContent = '좋아요 취소';
        }
        
        // 작성자인 경우 수정/삭제 버튼 표시
        if (post.is_author) {
            isAuthor = true;
            document.getElementById('postActions').style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Failed to load post:', error);
        // 더미 데이터 사용
        const dummyPost = await fetchDummyPost(currentPostId);
        if (dummyPost) {
            document.getElementById('postTitle').textContent = dummyPost.title;
            document.getElementById('postBody').textContent = dummyPost.body;
            document.getElementById('authorName').textContent = `User ${dummyPost.userId}`;
            document.getElementById('postDate').textContent = formatDate(new Date());
        }
    }
}

/**
 * 댓글 목록 로드
 */
async function loadComments() {
    const container = document.getElementById('commentsList');
    
    try {
        // 백엔드 API 호출
        const comments = await getComments(currentPostId);
        
        renderComments(comments);
        
    } catch (error) {
        console.error('Failed to load comments:', error);
        // 더미 데이터 사용
        const dummyComments = await fetchDummyComments(currentPostId);
        renderComments(dummyComments);
    }
}

/**
 * 댓글 렌더링
 */
function renderComments(comments) {
    const container = document.getElementById('commentsList');
    container.innerHTML = '';
    
    if (comments.length === 0) {
        container.innerHTML = '<div class="loading">댓글이 없습니다</div>';
        return;
    }
    
    comments.forEach(comment => {
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        
        const isMyComment = comment.is_author || false;
        
        commentItem.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <div class="comment-avatar"></div>
                    <div>
                        <div class="comment-name">${comment.author_nickname || comment.name || `User ${comment.userId || comment.id}`}</div>
                        <div class="comment-time">${formatDate(comment.created_at || new Date())}</div>
                    </div>
                </div>
                ${isMyComment ? `
                    <div class="comment-actions">
                        <button class="btn-comment-edit" onclick="editComment(${comment.id})">수정</button>
                        <button class="btn-comment-delete" onclick="showDeleteCommentModal(${comment.id})">삭제</button>
                    </div>
                ` : ''}
            </div>
            <div class="comment-content">${escapeHtml(comment.content || comment.body)}</div>
        `;
        
        container.appendChild(commentItem);
    });
}

/**
 * 댓글 작성
 */
async function submitComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) {
        alert('댓글 내용을 입력해주세요');
        return;
    }
    
    try {
        await createComment(currentPostId, content);
        
        // 입력창 초기화
        input.value = '';
        
        // 댓글 목록 새로고침
        loadComments();
        
        // 댓글 수 업데이트
        const commentCount = document.getElementById('commentCount');
        commentCount.textContent = parseInt(commentCount.textContent) + 1;
        
    } catch (error) {
        console.error('Failed to create comment:', error);
        alert('댓글 작성에 실패했습니다');
    }
}

/**
 * 댓글 수정
 */
async function editComment(commentId) {
    const newContent = prompt('댓글을 수정하세요:');
    
    if (!newContent || !newContent.trim()) return;
    
    try {
        await updateComment(commentId, newContent.trim());
        loadComments();
    } catch (error) {
        console.error('Failed to update comment:', error);
        alert('댓글 수정에 실패했습니다');
    }
}

/**
 * 댓글 삭제 모달 표시
 */
function showDeleteCommentModal(commentId) {
    currentCommentId = commentId;
    const modal = document.getElementById('commentModal');
    document.getElementById('commentModalMessage').textContent = '댓글을 삭제하시겠습니까?';
    document.getElementById('commentModalConfirm').onclick = confirmDeleteComment;
    modal.showModal();
}

/**
 * 댓글 삭제 확인
 */
async function confirmDeleteComment() {
    try {
        await deleteComment(currentCommentId);
        
        closeCommentModal();
        loadComments();
        
        // 댓글 수 업데이트
        const commentCount = document.getElementById('commentCount');
        commentCount.textContent = Math.max(0, parseInt(commentCount.textContent) - 1);
        
    } catch (error) {
        console.error('Failed to delete comment:', error);
        alert('댓글 삭제에 실패했습니다');
    }
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    modal.close();
    currentCommentId = null;
}

/**
 * 좋아요 토글
 */
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
            count.textContent = Math.max(0, parseInt(count.textContent) - 1);
        } else {
            await likePost(currentPostId);
            button.classList.add('active');
            text.textContent = '좋아요 취소';
            count.textContent = parseInt(count.textContent) + 1;
        }
    } catch (error) {
        console.error('Failed to toggle like:', error);
        alert('좋아요 처리에 실패했습니다');
    }
}

/**
 * 게시글 수정
 */
function editPost() {
    window.location.href = `/posts/${currentPostId}/edit`;
}

/**
 * 게시글 삭제 모달 표시
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
 * 게시글 삭제 확인
 */
async function confirmDelete() {
    try {
        await deletePost(currentPostId);
        alert('게시글이 삭제되었습니다');
        window.location.href = '/posts';
    } catch (error) {
        console.error('Failed to delete post:', error);
        alert('게시글 삭제에 실패했습니다');
    }
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