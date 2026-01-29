/**
 * 게시글 목록 페이지 - 인피니티 스크롤 버전
 */

let currentPage = 1;
const limit = 10;
let isLoading = false;
let hasMorePosts = true;

document.addEventListener('DOMContentLoaded', function () {
    // 헤더 프로필 이미지 로드
    loadHeaderProfile();

    // 초기 게시글 로드
    loadPosts();

    // 드롭다운 메뉴
    const btnMenu = document.getElementById('btnMenu');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (btnMenu && dropdownMenu) {
        btnMenu.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', function () {
            dropdownMenu.classList.remove('show');
        });
    }

    // 인피니티 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleScroll);
});

/**
 * 헤더 프로필 이미지 로드
 */
async function loadHeaderProfile() {
    try {
        const response = await getMe();
        const user = response.data || response;

        const headerImage = document.getElementById('headerProfileImage');
        if (headerImage && user.profile_image_url) {
            let imageUrl = user.profile_image_url;
            if (imageUrl.startsWith('/')) {
                imageUrl = `http://localhost:8000${imageUrl}`;
            }
            headerImage.src = imageUrl;
            headerImage.onerror = function () {
                this.src = '/images/default-profile.png';
            };
        }
    } catch (error) {
        console.log('헤더 프로필 로드 실패:', error);
    }
}

/**
 * 스크롤 이벤트 핸들러
 */
function handleScroll() {
    // 페이지 하단에 도달했는지 확인
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // 하단에서 200px 이내에 도달하면 추가 로드
    if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMorePosts();
    }
}

/**
 * 추가 게시글 로드 (인피니티 스크롤)
 */
async function loadMorePosts() {
    if (isLoading || !hasMorePosts) return;

    currentPage++;
    await loadPosts(currentPage, true);
}

/**
 * 게시글 로드
 * @param {number} page - 페이지 번호
 * @param {boolean} append - 기존 목록에 추가할지 여부
 */
async function loadPosts(page = 1, append = false) {
    if (isLoading) return;

    isLoading = true;

    const container = document.getElementById('postsList');

    if (!append) {
        container.innerHTML = '<div class="loading">게시글을 불러오는 중...</div>';
    } else {
        // 로딩 인디케이터 추가
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading loading-more';
        loadingDiv.id = 'loadingMore';
        loadingDiv.textContent = '더 불러오는 중...';
        container.appendChild(loadingDiv);
    }

    try {
        console.log('📋 게시글 목록 요청:', page);

        const response = await getPosts(page, limit);

        console.log('✅ 게시글 목록 응답:', response);

        // 응답 데이터 파싱
        let posts = [];
        if (Array.isArray(response.data)) {
            posts = response.data;
        } else {
            posts = response.data?.items || response.data?.posts || [];
        }

        // 더 이상 게시글이 없는지 확인 (backend에서 total을 주지 않으므로 length로 판단)
        if (posts.length < limit) {
            hasMorePosts = false;
        }

        // 로딩 인디케이터 제거
        const loadingMore = document.getElementById('loadingMore');
        if (loadingMore) {
            loadingMore.remove();
        }

        if (posts && posts.length > 0) {
            console.log('✅ 게시글 수:', posts.length);
            renderPosts(posts, append);
        } else if (!append) {
            console.log('⚠️ 게시글 없음');
            container.innerHTML = '<div class="empty-message">게시글이 없습니다. 첫 번째 글을 작성해보세요!</div>';
        }

    } catch (error) {
        console.error('❌ 게시글 목록 에러:', error);

        // 로딩 인디케이터 제거
        const loadingMore = document.getElementById('loadingMore');
        if (loadingMore) {
            loadingMore.remove();
        }

        if (!append) {
            // 더미 데이터 사용 (개발용)
            console.log('🔄 더미 데이터 사용');
            const dummyPosts = await fetchDummyPosts(10);
            renderPosts(dummyPosts, false);
        }
    } finally {
        isLoading = false;
    }
}

/**
 * 게시글 렌더링
 * @param {Array} posts - 게시글 배열
 * @param {boolean} append - 기존 목록에 추가할지 여부
 */
function renderPosts(posts, append = false) {
    const container = document.getElementById('postsList');

    if (!append) {
        container.innerHTML = '';
    }

    posts.forEach(post => {
        const postItem = document.createElement('div');
        postItem.className = 'post-item';
        postItem.onclick = () => navigateTo(`/posts/${post.id}`);

        // 프로필 이미지 URL 처리
        let profileImageUrl = '/images/default-profile.png';
        if (post.author_profile_image) {
            if (post.author_profile_image.startsWith('/')) {
                profileImageUrl = `http://localhost:8000${post.author_profile_image}`;
            } else {
                profileImageUrl = post.author_profile_image;
            }
        }

        // 통계 포맷팅 (1000 이상 -> k 표시)
        const likesDisplay = formatCount(post.likes_count || 0);
        const commentsDisplay = formatCount(post.comments_count || 0);
        const viewsDisplay = formatCount(post.view_count || 0);

        // 게시글 이미지 주소 처리
        let postImageUrl = post.image_url;
        if (postImageUrl && postImageUrl.startsWith('/')) {
            postImageUrl = `http://localhost:8000${postImageUrl}`;
        }

        postItem.innerHTML = `
            <div class="post-card" onclick="location.href='/posts/${post.id}'">
                <div class="post-header">
                    <img src="${profileImageUrl || '/images/default-profile.png'}" alt="프로필" class="post-avatar" onerror="this.src='/images/default-profile.png'">
                    <div class="post-info">
                        <div class="post-author">${post.author_nickname || '익명'}</div>
                        <div class="post-date">${formatDateTime(post.created_at)}</div>
                    </div>
                </div>
                <div class="post-title">${truncateTitle(post.title, 26)}</div>
                <div class="post-stats">
                    <div class="stat-item">
                        좋아요 ${likesDisplay}
                    </div>
                    <div class="stat-item">
                        댓글 ${commentsDisplay}
                    </div>
                    <div class="stat-item">
                        조회수 ${viewsDisplay}
                    </div>
                </div>
            </div>
        `;

        container.appendChild(postItem);
    });
}

/**
 * 숫자 포맷팅 (1000 -> 1k, 10000 -> 10k)
 */
function formatCount(count) {
    if (count >= 100000) {
        return Math.floor(count / 1000) + 'k';
    } else if (count >= 10000) {
        return Math.floor(count / 1000) + 'k';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return count.toString();
}

/**
 * 제목 길이 제한 (26자)
 */
function truncateTitle(title, maxLength = 26) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
}

/**
 * 날짜/시간 포맷팅 (yyyy-mm-dd hh:mm:ss)
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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