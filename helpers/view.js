const path = require('path');

/**
 * HTML 파일 반환 헬퍼
 * @param {object} res - Express response 객체
 * @param {string} viewName - 'login' → views/login.html
 */
const sendView = (res, viewName) => {
    res.sendFile(path.join(__dirname, '..', 'views', `${viewName}.html`));
};

module.exports = { sendView };