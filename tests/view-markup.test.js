const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readView(name) {
    return fs.readFileSync(path.join(__dirname, '..', 'views', name), 'utf8');
}

test('messages view keeps chat partner image id required by runtime script', () => {
    const html = readView('messages.html');
    assert.match(html, /id="chatPartnerImage"/);
});

test('post detail view keeps author image id required by runtime script', () => {
    const html = readView('post-detail.html');
    assert.match(html, /id="authorImage"/);
});

test('write and edit views keep preview image and remove button ids', () => {
    const writeHtml = readView('write.html');
    const editHtml = readView('post-edit.html');

    assert.match(writeHtml, /id="previewImg"/);
    assert.match(writeHtml, /id="btnRemoveImage"/);
    assert.match(editHtml, /id="previewImg"/);
    assert.match(editHtml, /id="btnRemoveImage"/);
});

test('profile edit view keeps preview image id required by runtime script', () => {
    const html = readView('profile-edit.html');
    assert.match(html, /id="previewImage"/);
});

test('signup view keeps delegated back navigation attribute', () => {
    const html = readView('signup.html');
    assert.match(html, /data-history-back="true"/);
});

test('chatbot view keeps personalization and streaming controls required by runtime script', () => {
    const html = readView('chatbot.html');

    assert.match(html, /id="preferenceSummary"/);
    assert.match(html, /id="preferenceChips"/);
    assert.match(html, /id="currentFilters"/);
    assert.match(html, /id="streamToggle"/);
    assert.match(html, /id="btnResetChat"/);
});
