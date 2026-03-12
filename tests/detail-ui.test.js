const test = require('node:test');
const assert = require('node:assert/strict');

global.document = {
    addEventListener: () => {},
    getElementById: () => ({ addEventListener: () => {}, style: {} })
};

const detailUi = require('../public/js/posts/detail.js');

test('extractComments handles various API response shapes', () => {
    // Standard shape
    assert.deepEqual(
        detailUi.extractComments({ data: [{ id: 1, text: 'hello' }] }),
        [{ id: 1, text: 'hello' }]
    );

    // Array directly
    assert.deepEqual(
        detailUi.extractComments([{ id: 2, text: 'world' }]),
        [{ id: 2, text: 'world' }]
    );

    // Null/undefined
    assert.deepEqual(detailUi.extractComments(null), []);
    assert.deepEqual(detailUi.extractComments(undefined), []);
});
