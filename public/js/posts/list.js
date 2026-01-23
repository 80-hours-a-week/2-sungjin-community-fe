/**
 * 게시글 목록 페이지 로직
 */

let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    
    // 드롭다운 메뉴
    const btnMenu = document.getElementById('btnMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    btnMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
    });
});

async function loadPosts(page = 1) {
    const container = document.getElementById('postsList');
    container.innerHTML = '<div class="loading">게시글을 불러오는 중...</div>';
    
    try {
        // 백엔드 API 호출
        const response = await getPosts(page, limit);
        
        if (response.data && response.data.posts.length > 0) {
            renderPosts(response.data.posts);
            renderPagination(response.data.total_pages, page);
        } else {
            container.innerHTML = '<div class="loading">게시글이 없습니다</div>';
        }
    } catch (error) {
        // 더미 데이터 사용
        const dummyPosts = await fetchDummyPosts(10);
        renderPosts(dummyPosts);
    }
}

function renderPosts(posts) {
    const container = document.getElementById('postsList');
    container.innerHTML = '';
    
    posts.forEach(post => {
        const postItem = document.createElement('div');
        postItem.className = 'post-item';
        postItem.onclick = () => navigateTo(`/posts/${post.id}`);
        
        postItem.innerHTML = `
            <div class="post-item-header">
                <div class="post-avatar"></div>
                <div>
                    <div class="post-author">${post.author_nickname || 'User ' + post.userId}</div>
                    <div class="post-time">${formatDate(post.created_at || new Date())}</div>
                </div>
            </div>
            <h3 class="post-item-title">${escapeHtml(post.title)}</h3>
            <p class="post-item-content">${escapeHtml(post.content || post.body)}</p>
            <div class="post-item-footer">
                <span>좋아요 ${post.likes_count || 0}</span>
                <span>댓글 ${post.comments_count || 0}</span>
                <span>조회 ${post.views || 0}</span>
            </div>
        `;
        
        container.appendChild(postItem);
    });
}

function renderPagination(totalPages, currentPage) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    
    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadPosts(currentPage - 1);
    container.appendChild(prevBtn);
    
    // 페이지 번호
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.onclick = () => loadPosts(i);
        container.appendChild(pageBtn);
    }
    
    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadPosts(currentPage + 1);
    container.appendChild(nextBtn);
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