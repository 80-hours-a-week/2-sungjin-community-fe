/**
 * Posts list page
 * - Sort: latest | hot | discussed
 * - Tag filter
 * - Trending section (tags + posts)
 */

const FEED_LIMIT = 10;
const TRENDING_DAYS = 7;
const TRENDING_LIMIT = 5;
const SORT_OPTIONS = ['latest', 'hot', 'discussed'];

const feedState = {
    page: 1,
    limit: FEED_LIMIT,
    sort: 'latest',
    tag: '',
    isLoading: false,
    hasMore: true
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const isReady = await ensureAuthenticated();
        if (!isReady) return;

        hydrateFiltersFromQuery();
        bindDropdownMenu();
        bindFilterControls();
        bindScrollHandler();

        await Promise.all([
            loadHeaderProfile(),
            resetFeed(),
            loadTrending()
        ]);
    });
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

function bindFilterControls() {
    const sortButtons = document.querySelectorAll('[data-sort]');
    const tagInput = document.getElementById('tagFilterInput');
    const applyButton = document.getElementById('btnApplyTag');
    const clearButton = document.getElementById('btnClearTag');

    sortButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const sort = button.dataset.sort;
            if (!SORT_OPTIONS.includes(sort) || sort === feedState.sort) {
                return;
            }

            feedState.sort = sort;
            renderSortButtons();
            syncFilterQuery();
            await resetFeed();
        });
    });

    if (tagInput) {
        tagInput.value = feedState.tag;
        tagInput.addEventListener('keydown', async (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            await applyTagFilter();
        });
    }

    if (applyButton) {
        applyButton.addEventListener('click', applyTagFilter);
    }

    if (clearButton) {
        clearButton.addEventListener('click', async () => {
            if (!feedState.tag && !(tagInput && tagInput.value.trim())) return;
            feedState.tag = '';
            if (tagInput) tagInput.value = '';
            syncFilterQuery();
            await resetFeed();
        });
    }

    renderSortButtons();
}

function bindScrollHandler() {
    const onScroll = debounce(async () => {
        if (feedState.isLoading || !feedState.hasMore) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const shouldLoadMore = scrollTop + clientHeight >= scrollHeight - 200;

        if (!shouldLoadMore) return;

        feedState.page += 1;
        await loadPosts(true);
    }, 120);

    window.addEventListener('scroll', onScroll);
}

function hydrateFiltersFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const querySort = params.get('sort');
    const queryTag = params.get('tag');

    if (SORT_OPTIONS.includes(querySort)) {
        feedState.sort = querySort;
    }

    if (queryTag) {
        feedState.tag = queryTag;
    }
}

function syncFilterQuery() {
    const params = new URLSearchParams(window.location.search);
    params.set('sort', feedState.sort);

    if (feedState.tag) {
        params.set('tag', feedState.tag);
    } else {
        params.delete('tag');
    }

    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', next);
}

function renderSortButtons() {
    const sortButtons = document.querySelectorAll('[data-sort]');
    sortButtons.forEach((button) => {
        const isActive = button.dataset.sort === feedState.sort;
        button.classList.toggle('active', isActive);
    });
}

async function applyTagFilter() {
    const tagInput = document.getElementById('tagFilterInput');
    if (!tagInput) return;

    const normalizedTag = String(tagInput.value || '').trim().replace(/^#/, '');
    if (feedState.tag === normalizedTag) return;

    feedState.tag = normalizedTag;
    syncFilterQuery();
    await resetFeed();
}

async function resetFeed() {
    feedState.page = 1;
    feedState.hasMore = true;

    const container = document.getElementById('postsList');
    if (container) {
        container.innerHTML = '<div class="loading">게시글을 불러오는 중...</div>';
    }

    await loadPosts(false);
}

async function loadPosts(append = false) {
    if (feedState.isLoading) return;

    feedState.isLoading = true;

    const container = document.getElementById('postsList');
    if (!container) {
        feedState.isLoading = false;
        return;
    }

    if (append) {
        appendLoadingIndicator(container, 'feedLoadingMore', '게시글을 더 불러오는 중...');
    }

    try {
        const response = await getPosts(feedState.page, feedState.limit, feedState.sort, feedState.tag);
        const posts = extractPostArray(response);

        if (!append) {
            container.innerHTML = '';
        }

        if (posts.length === 0 && !append) {
            container.innerHTML = '<div class="empty-message">조건에 맞는 게시글이 없습니다.</div>';
            feedState.hasMore = false;
            return;
        }

        renderPosts(posts, container);
        if (posts.length < feedState.limit) {
            feedState.hasMore = false;
        }
    } catch (error) {
        if (!append) {
            container.innerHTML = '<div class="empty-message">피드를 불러오지 못했습니다.</div>';
        }
        handleApiError(error, {
            fallbackMessage: '피드를 불러오는 중 오류가 발생했습니다.'
        });
    } finally {
        removeLoadingIndicator('feedLoadingMore');
        feedState.isLoading = false;
    }
}

function extractPostArray(response) {
    if (!response) return [];
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data && response.data.items)) return response.data.items;
    if (Array.isArray(response.data && response.data.posts)) return response.data.posts;
    if (Array.isArray(response)) return response;
    return [];
}

function renderPosts(posts, container) {
    posts.forEach((post) => {
        const postItem = document.createElement('article');
        postItem.className = 'post-item';
        postItem.addEventListener('click', () => {
            navigateTo(`/posts/${post.id}`);
        });

        postItem.innerHTML = buildPostCardHtml(post);
        container.appendChild(postItem);
    });
}

function buildPostCardHtml(post) {
    const postTags = normalizePostTags(post.tags);
    const tagsHtml = postTags.length > 0
        ? `<div class="post-tags">${postTags.map((tag) => `<span class="tag-chip">#${safeEscape(tag)}</span>`).join('')}</div>`
        : '';

    return `
        <div class="post-item-header">
            <img
                src="${safeEscape(resolveImageUrl(post.author_profile_image, '/images/default-profile.png'))}"
                alt="프로필"
                class="post-avatar"
                onerror="this.src='/images/default-profile.png'"
            >
            <div>
                <span class="post-author">${safeEscape(post.author_nickname || '익명')}</span>
                <span class="post-time">${safeEscape(safeFormatDate(post.created_at || new Date().toISOString()))}</span>
            </div>
        </div>

        <div class="post-item-title">${safeEscape(safeTruncate(post.title || '', 50))}</div>
        <div class="post-item-content">${safeEscape(safeTruncate(post.content || '', 150))}</div>

        ${buildPostImageHtml(post.image_url)}
        ${tagsHtml}

        <div class="post-item-footer">
            <div class="post-stats-list">
                <div class="post-stat"><span>좋아요</span>${formatStatCount(post.likes_count || 0)}</div>
                <div class="post-stat"><span>댓글</span>${formatStatCount(post.comments_count || 0)}</div>
                <div class="post-stat"><span>조회</span>${formatStatCount(post.view_count || post.views || 0)}</div>
            </div>
        </div>
    `;
}

function buildPostImageHtml(imageUrl) {
    if (!imageUrl) return '';
    return `
        <div class="post-image-preview">
            <img src="${safeEscape(resolveImageUrl(imageUrl))}" alt="게시글 이미지" loading="lazy">
        </div>
    `;
}

async function loadTrending() {
    const trendingPostsContainer = document.getElementById('trendingPostsList');
    const trendingTagsContainer = document.getElementById('trendingTagsList');

    if (!trendingPostsContainer || !trendingTagsContainer) return;

    trendingPostsContainer.innerHTML = '<div class="loading">트렌딩을 불러오는 중...</div>';
    trendingTagsContainer.innerHTML = '';

    try {
        const response = await getTrendingPosts(TRENDING_DAYS, TRENDING_LIMIT);
        const trendingData = response && response.data ? response.data : response;
        const posts = Array.isArray(trendingData.posts) ? trendingData.posts : extractPostArray(response);
        const topTags = Array.isArray(trendingData.top_tags) ? trendingData.top_tags : null;

        renderTrendingPosts(posts, trendingPostsContainer);
        renderTrendingTags(topTags, posts, trendingTagsContainer);
    } catch (error) {
        trendingPostsContainer.innerHTML = '<div class="empty-message">트렌딩 정보를 불러오지 못했습니다.</div>';
        handleApiError(error, {
            fallbackMessage: '트렌딩 정보를 불러오지 못했습니다.'
        });
    }
}

function renderTrendingPosts(posts, container) {
    if (!posts.length) {
        container.innerHTML = '<div class="empty-message">트렌딩 게시글이 없습니다.</div>';
        return;
    }

    container.innerHTML = '';

    posts.forEach((post, index) => {
        const item = document.createElement('button');
        item.className = 'trending-post-item';
        item.type = 'button';
        item.addEventListener('click', () => navigateTo(`/posts/${post.id}`));
        item.innerHTML = buildTrendingPostItemHtml(post, index);
        container.appendChild(item);
    });
}

function renderTrendingTags(topTags, posts, container) {
    // BE API의 top_tags 응답을 우선 사용하고, 없을 경우 게시글에서 직접 집계
    let rankedTags;
    if (Array.isArray(topTags) && topTags.length > 0) {
        rankedTags = topTags.map((item) => ({ tag: item.name, count: item.count }));
    } else {
        rankedTags = collectTrendingTags(posts);
    }

    if (!rankedTags.length) {
        container.innerHTML = '<span class="empty-inline">태그 데이터가 없습니다.</span>';
        return;
    }

    container.innerHTML = '';
    rankedTags.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'trending-tag-chip';
        button.innerHTML = buildTrendingTagChipHtml(item.tag, item.count);
        button.addEventListener('click', async () => {
            const tagInput = document.getElementById('tagFilterInput');
            if (tagInput) tagInput.value = item.tag;
            feedState.tag = item.tag;
            syncFilterQuery();
            await resetFeed();
        });
        container.appendChild(button);
    });
}

function buildTrendingPostItemHtml(post, index) {
    return `
        <span class="trending-rank">${index + 1}</span>
        <div class="trending-content">
            <strong>${safeEscape(safeTruncate(post.title || '', 50))}</strong>
            <small>좋아요 ${formatStatCount(post.likes_count || 0)} · 댓글 ${formatStatCount(post.comments_count || 0)}</small>
        </div>
    `;
}

function buildTrendingTagChipHtml(tag, count) {
    return `#${safeEscape(tag)} <span>${count}</span>`;
}

function collectTrendingTags(posts) {
    const counts = new Map();

    posts.forEach((post) => {
        normalizePostTags(post.tags).forEach((tag) => {
            counts.set(tag, (counts.get(tag) || 0) + 1);
        });
    });

    return [...counts.entries()]
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
        .slice(0, 8);
}

function normalizePostTags(tags) {
    if (!Array.isArray(tags)) return [];

    return [...new Set(tags
        .map((tag) => {
            if (typeof tag === 'string') return tag.trim().replace(/^#/, '');
            if (tag && typeof tag.name === 'string') return tag.name.trim().replace(/^#/, '');
            return '';
        })
        .filter(Boolean)
    )];
}

function resolveImageUrl(imageUrl, fallback = '') {
    if (!imageUrl) return fallback;
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (typeof toApiUrl === 'function') return toApiUrl(imageUrl);
    return imageUrl;
}

function safeEscape(value) {
    if (typeof escapeHtml === 'function') {
        return escapeHtml(value);
    }

    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeTruncate(value, maxLength) {
    if (typeof truncateText === 'function') {
        return truncateText(value, maxLength);
    }
    const text = String(value || '');
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function safeFormatDate(value) {
    if (typeof formatDate === 'function') {
        return formatDate(value);
    }
    return new Date(value).toISOString().split('T')[0];
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
        // Header image failure should not block page rendering.
        console.debug('Failed to load profile image on feed header:', error.message);
    }
}

function appendLoadingIndicator(container, id, message) {
    removeLoadingIndicator(id);
    const loading = document.createElement('div');
    loading.className = 'loading loading-more';
    loading.id = id;
    loading.textContent = message;
    container.appendChild(loading);
}

function removeLoadingIndicator(id) {
    const loading = document.getElementById(id);
    if (loading) loading.remove();
}

const postsListTestUtils = {
    extractPostArray,
    collectTrendingTags,
    normalizePostTags,
    buildPostCardHtml,
    buildTrendingPostItemHtml,
    buildTrendingTagChipHtml
};

if (typeof window !== 'undefined') {
    window.__postsListTestUtils = postsListTestUtils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = postsListTestUtils;
}
