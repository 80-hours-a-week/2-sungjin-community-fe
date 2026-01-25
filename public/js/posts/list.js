

let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    

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
        console.log('📋 게시글 목록 요청:', page);
        

        const response = await getPosts(page, limit);
        
        console.log('✅ 게시글 목록 응답:', response);
        

        const posts = response.data?.items || response.data?.posts || [];
        const totalPages = response.data?.total_pages || Math.ceil((response.data?.total || 0) / limit);
        
        if (posts && posts.length > 0) {
            console.log('✅ 게시글 수:', posts.length);
            renderPosts(posts);
            if (totalPages > 0) {
                renderPagination(totalPages, page);
            }
        } else {
            console.log('⚠️ 게시글 없음');
            container.innerHTML = '<div class="loading">게시글이 없습니다</div>';
        }
    } catch (error) {
        console.error('❌ 게시글 목록 에러:', error);

        console.log('🔄 더미 데이터 사용');
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
        
       
        let profileImageUrl = '/images/default-profile.png';
        if (post.author_profile_image) {

            if (post.author_profile_image.startsWith('/')) {
               
                profileImageUrl = `http://localhost:8000${post.author_profile_image}`;
            } else {
                profileImageUrl = post.author_profile_image;
            }
        }
        
        postItem.innerHTML = `
            <div class="post-item-header">
                <div class="post-avatar" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #ddd; display: flex; align-items: center; justify-content: center;">
                    <img src="${profileImageUrl}" alt="프로필" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.src='/images/default-profile.png'">
                </div>
                <div>
                    <div class="post-author">${post.author_nickname || 'User ' + (post.userId || post.user_id || post.id)}</div>
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
    

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadPosts(currentPage - 1);
    container.appendChild(prevBtn);
    

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.onclick = () => loadPosts(i);
        container.appendChild(pageBtn);
    }
    

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