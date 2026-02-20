const test = require('node:test');
const assert = require('node:assert/strict');

const utils = require('../public/js/utils.js');

// Mock global utils for list.js
Object.assign(global, utils);

// Mock other global functions used in list.js
global.safeEscape = utils.escapeHtml;
global.safeTruncate = utils.truncateText;
global.safeFormatDate = utils.formatDate;

const feedUtils = require('../public/js/posts/list.js');

test('collectTrendingTags aggregates and sorts tags by frequency', () => {
    const tags = feedUtils.collectTrendingTags([
        { tags: ['react', 'frontend'] },
        { tags: ['react', 'javascript'] },
        { tags: ['frontend'] }
    ]);

    assert.deepEqual(tags, [
        { tag: 'frontend', count: 2 },
        { tag: 'react', count: 2 },
        { tag: 'javascript', count: 1 }
    ]);
});

test('buildPostCardHtml renders tag chips for filtered feed UI', () => {
    const html = feedUtils.buildPostCardHtml({
        id: 10,
        title: '테스트 게시글',
        content: '내용',
        created_at: '2026-02-13T00:00:00.000Z',
        author_nickname: 'tester',
        likes_count: 12,
        comments_count: 3,
        view_count: 50,
        tags: ['react', 'frontend']
    });

    assert.match(html, /#react/);
    assert.match(html, /#frontend/);
    assert.match(html, /좋아요/);
    assert.match(html, /댓글/);
});

test('buildTrending helpers render rank, stats, and tag counters', () => {
    const postHtml = feedUtils.buildTrendingPostItemHtml({
        title: '트렌딩 테스트',
        likes_count: 42,
        comments_count: 11
    }, 1);

    const tagHtml = feedUtils.buildTrendingTagChipHtml('react', 4);

    assert.match(postHtml, /trending-rank\">2/);
    assert.match(postHtml, /좋아요 42/);
    assert.match(postHtml, /댓글 11/);
    assert.match(tagHtml, /#react/);
    assert.match(tagHtml, />4</);
});
