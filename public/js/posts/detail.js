

let currentPostId = null;
let isAuthor = false;
let currentCommentId = null;

document.addEventListener('DOMContentLoaded', function() {

    const pathParts = window.location.pathname.split('/');
    currentPostId = pathParts[pathParts.length - 1];
    
    if (currentPostId) {
        loadPostDetail();
        loadComments();
    }
    

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


async function loadPostDetail() {
    try {
        console.log('📄 게시글 상세 로드:', currentPostId);
        

        const response = await getPost(currentPostId);
        
        console.log('✅ 게시글 응답:', response);
        

        const post = response.data || response;
        
        if (!post || !post.title) throw new Error('게시글을 찾을 수 없습니다');
        
        console.log('✅ 게시글 데이터:', post);
        
        
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postBody').textContent = post.content;
        
   
        if (post.author_nickname) {
            document.getElementById('authorName').textContent = post.author_nickname;
        }
        

        if (post.author_profile_image) {
            let profileImageUrl = post.author_profile_image;
            if (profileImageUrl.startsWith('/')) {

                profileImageUrl = `http://localhost:8000${profileImageUrl}`;
            }
            
            const authorImage = document.getElementById('authorImage');
            if (authorImage) {
                authorImage.src = profileImageUrl;
                authorImage.onerror = function() {
                    this.src = '/images/default-profile.png';
                };
            }
        }
        

        document.getElementById('postDate').textContent = formatDate(post.created_at);
        

        if (post.image_url) {
            const imageDiv = document.getElementById('postImage');
            imageDiv.innerHTML = `<img src="${post.image_url}" alt="게시글 이미지">`;
            imageDiv.style.display = 'block';
        }
        

        document.getElementById('viewCount').textContent = post.views || 0;
        document.getElementById('likeCount').textContent = post.likes_count || 0;
        document.getElementById('commentCount').textContent = post.comments_count || 0;
        
  
        if (post.is_liked) {
            document.getElementById('likeButton').classList.add('active');
            document.getElementById('likeText').textContent = '좋아요 취소';
        }
        

        if (post.is_author) {
            isAuthor = true;
            document.getElementById('postActions').style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Failed to load post:', error);

        const dummyPost = await fetchDummyPost(currentPostId);
        if (dummyPost) {
            document.getElementById('postTitle').textContent = dummyPost.title;
            document.getElementById('postBody').textContent = dummyPost.body;
            document.getElementById('authorName').textContent = `User ${dummyPost.userId}`;
            document.getElementById('postDate').textContent = formatDate(new Date());
        }
    }
}


async function loadComments() {
    const container = document.getElementById('commentsList');
    
    try {
        console.log('💬 댓글 목록 로드:', currentPostId);
        
  
        const response = await getComments(currentPostId);
        
        console.log('✅ 댓글 응답:', response);
        

        let comments = [];
        if (Array.isArray(response)) {
            comments = response;
        } else if (response.data) {
            comments = Array.isArray(response.data) ? response.data : [];
        }
        
        console.log('✅ 댓글 배열:', comments);
        
        renderComments(comments);
        
    } catch (error) {
        console.error('❌ 댓글 로드 실패:', error);

        const dummyComments = await fetchDummyComments(currentPostId);
        renderComments(dummyComments);
    }
}


function renderComments(comments) {
    const container = document.getElementById('commentsList');
    container.innerHTML = '';
    
    if (!Array.isArray(comments) || comments.length === 0) {
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


async function submitComment() {
    const input = document.getElementById('commentInput');
    const content = input.value.trim();
    
    if (!content) {
        alert('댓글 내용을 입력해주세요');
        return;
    }
    
    try {
        await createComment(currentPostId, content);
        

        input.value = '';
        

        loadComments();
        

        const commentCount = document.getElementById('commentCount');
        commentCount.textContent = parseInt(commentCount.textContent) + 1;
        
    } catch (error) {
        console.error('Failed to create comment:', error);
        alert('댓글 작성에 실패했습니다');
    }
}


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


function showDeleteCommentModal(commentId) {
    currentCommentId = commentId;
    const modal = document.getElementById('commentModal');
    document.getElementById('commentModalMessage').textContent = '댓글을 삭제하시겠습니까?';
    document.getElementById('commentModalConfirm').onclick = confirmDeleteComment;
    modal.showModal();
}


async function confirmDeleteComment() {
    try {
        await deleteComment(currentCommentId);
        
        closeCommentModal();
        loadComments();
        

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


function editPost() {
    window.location.href = `/posts/${currentPostId}/edit`;
}


function showDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.showModal();
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.close();
}


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


function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        logout().then(() => {
            window.location.href = '/login';
        }).catch(() => {
            window.location.href = '/login';
        });
    }
}