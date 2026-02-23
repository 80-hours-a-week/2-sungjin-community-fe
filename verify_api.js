const BASE_URL = (process.env.API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const TEST_PASSWORD = process.env.VERIFY_PASSWORD || 'Password1234!';

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function buildUniqueUser() {
    const seed = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const email = `fe-integration-${seed}@example.com`;
    const nickname = `u${seed.slice(-9)}`; // 1~10 chars
    return { email, nickname };
}

async function requestJson(path, options = {}) {
    const {
        method = 'GET',
        token = '',
        body = undefined,
        expectedStatuses = [200]
    } = options;

    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const requestOptions = { method, headers };
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, requestOptions);
    const raw = await response.text();

    let payload = null;
    if (raw) {
        try {
            payload = JSON.parse(raw);
        } catch (error) {
            payload = { message: raw };
        }
    }

    if (!expectedStatuses.includes(response.status)) {
        throw new Error(
            `${method} ${path} failed (${response.status})\n${JSON.stringify(payload, null, 2)}`
        );
    }

    return payload;
}

async function testApi() {
    const user = buildUniqueUser();
    const updatedNickname = `${user.nickname.slice(0, 8)}x`;
    const tag = `tag${Date.now().toString().slice(-5)}`;

    let accessToken = '';
    let refreshToken = '';
    let postId = null;
    let commentId = null;

    try {
        console.log('1. Signing up...');
        await requestJson('/auth/signup', {
            method: 'POST',
            body: {
                email: user.email,
                password: TEST_PASSWORD,
                nickname: user.nickname
            },
            expectedStatuses: [201]
        });
        console.log('Signup successful.');

        console.log('2. Logging in...');
        const loginPayload = await requestJson('/auth/login', {
            method: 'POST',
            body: {
                email: user.email,
                password: TEST_PASSWORD
            }
        });

        const tokenData = loginPayload && loginPayload.data ? loginPayload.data : {};
        accessToken = tokenData.access_token;
        refreshToken = tokenData.refresh_token;
        assert(accessToken, 'Missing access_token in login response.');
        assert(refreshToken, 'Missing refresh_token in login response.');
        console.log('Login successful.');

        console.log('3. Fetching my profile...');
        const mePayload = await requestJson('/users/me', { token: accessToken });
        assert(mePayload && mePayload.data && mePayload.data.email === user.email, 'Profile email mismatch.');
        console.log('Profile fetch successful.');

        console.log('4. Updating profile nickname...');
        const profilePayload = await requestJson('/users/me', {
            method: 'PATCH',
            token: accessToken,
            body: { nickname: updatedNickname }
        });
        assert(profilePayload && profilePayload.data && profilePayload.data.nickname === updatedNickname, 'Nickname update failed.');
        console.log('Profile update successful.');

        console.log('5. Creating post...');
        const createPayload = await requestJson('/posts', {
            method: 'POST',
            token: accessToken,
            body: {
                title: 'Frontend Integration Test',
                content: 'verify_api.js integrated flow test',
                image_url: null,
                tags: [tag, 'frontend']
            },
            expectedStatuses: [201]
        });
        postId = createPayload && createPayload.data ? createPayload.data.id : null;
        assert(postId, 'Post ID missing after create.');
        console.log(`Post created: ${postId}`);

        console.log('6. Reading post list with tag filter...');
        const listPayload = await requestJson(`/posts?page=1&limit=10&sort=latest&tag=${encodeURIComponent(tag)}`, {
            token: accessToken
        });
        const listedPosts = Array.isArray(listPayload && listPayload.data) ? listPayload.data : [];
        assert(listedPosts.some((post) => post.id === postId), 'Created post not found in tag-filtered list.');
        console.log('List API successful.');

        console.log('7. Reading post detail...');
        const detailPayload = await requestJson(`/posts/${postId}`, { token: accessToken });
        assert(detailPayload && detailPayload.data && detailPayload.data.id === postId, 'Post detail mismatch.');
        console.log('Post detail successful.');

        console.log('8. Like/Unlike post...');
        await requestJson(`/posts/${postId}/likes`, {
            method: 'POST',
            token: accessToken,
            expectedStatuses: [201]
        });
        await requestJson(`/posts/${postId}/likes`, {
            method: 'DELETE',
            token: accessToken
        });
        console.log('Like/Unlike successful.');

        console.log('9. Comment CRUD...');
        const createCommentPayload = await requestJson(`/posts/${postId}/comments`, {
            method: 'POST',
            token: accessToken,
            body: { content: 'integration comment' },
            expectedStatuses: [201]
        });
        commentId = createCommentPayload && createCommentPayload.data ? createCommentPayload.data.id : null;
        assert(commentId, 'Comment ID missing after create.');

        await requestJson(`/posts/${postId}/comments/${commentId}`, {
            method: 'PUT',
            token: accessToken,
            body: { content: 'integration comment updated' }
        });

        await requestJson(`/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            token: accessToken
        });
        commentId = null;
        console.log('Comment CRUD successful.');

        console.log('10. Updating post...');
        const updatePayload = await requestJson(`/posts/${postId}`, {
            method: 'PUT',
            token: accessToken,
            body: {
                title: 'Integration Test Updated',
                content: 'updated content',
                image_url: null,
                tags: [tag, 'updated']
            }
        });
        assert(
            updatePayload && updatePayload.data && updatePayload.data.title === 'Integration Test Updated',
            'Post update verification failed.'
        );
        console.log('Post update successful.');

        console.log('11. Reading trending posts...');
        await requestJson('/posts/trending?days=7&limit=5', { token: accessToken });
        console.log('Trending API successful.');

        console.log('12. Deleting post...');
        await requestJson(`/posts/${postId}`, {
            method: 'DELETE',
            token: accessToken
        });
        postId = null;
        console.log('Post delete successful.');

        console.log('13. Withdrawing user...');
        await requestJson('/users/me', {
            method: 'DELETE',
            token: accessToken
        });
        console.log('User withdrawal successful.');

        console.log('14. Logging out...');
        await requestJson('/auth/logout', {
            method: 'POST',
            body: { refresh_token: refreshToken }
        });
        refreshToken = '';
        console.log('Logout successful.');

        console.log('\nAll API integration checks passed.');
    } catch (error) {
        console.error('\nIntegration test failed.');
        console.error(error && error.stack ? error.stack : error);
        process.exitCode = 1;
    } finally {
        if (commentId && postId && accessToken) {
            try {
                await requestJson(`/posts/${postId}/comments/${commentId}`, {
                    method: 'DELETE',
                    token: accessToken,
                    expectedStatuses: [200, 401, 403, 404]
                });
            } catch (cleanupError) {
                console.error('Cleanup warning (comment):', cleanupError.message);
            }
        }

        if (postId && accessToken) {
            try {
                await requestJson(`/posts/${postId}`, {
                    method: 'DELETE',
                    token: accessToken,
                    expectedStatuses: [200, 401, 403, 404]
                });
            } catch (cleanupError) {
                console.error('Cleanup warning (post):', cleanupError.message);
            }
        }

        if (refreshToken) {
            try {
                await requestJson('/auth/logout', {
                    method: 'POST',
                    body: { refresh_token: refreshToken },
                    expectedStatuses: [200, 400, 401]
                });
            } catch (cleanupError) {
                console.error('Cleanup warning (logout):', cleanupError.message);
            }
        }
    }
}

testApi();
