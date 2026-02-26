const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = (process.env.FILE_UPLOAD_API_URL || '').replace(/\/+$/, '');
const TEST_IMAGE_PATH = process.env.VERIFY_UPLOAD_FILE || path.join(__dirname, 'test_image.png');

if (!BASE_URL) {
    console.error('FILE_UPLOAD_API_URL is required.');
    process.exit(1);
}

async function run() {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        throw new Error(`Test file not found: ${TEST_IMAGE_PATH}`);
    }

    const fileBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const fileName = path.basename(TEST_IMAGE_PATH);
    const ext = path.extname(fileName).toLowerCase();
    const fileType = ext === '.png' ? 'image/png' : 'application/octet-stream';

    console.log('1. Requesting presigned upload URL...');
    const initRes = await fetch(`${BASE_URL}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file_name: fileName,
            file_type: fileType,
            upload_type: 'post'
        })
    });

    const initPayload = await initRes.json();
    if (!initRes.ok) {
        throw new Error(`Upload URL request failed: ${initRes.status} ${JSON.stringify(initPayload)}`);
    }

    const data = initPayload && initPayload.data ? initPayload.data : initPayload;
    if (!data || !data.upload_url || !data.image_url) {
        throw new Error(`Invalid response payload: ${JSON.stringify(initPayload)}`);
    }

    console.log('2. Uploading file to S3 with presigned URL...');
    const uploadRes = await fetch(data.upload_url, {
        method: 'PUT',
        headers: {
            'Content-Type': fileType
        },
        body: fileBuffer
    });

    if (!uploadRes.ok) {
        throw new Error(`S3 upload failed: ${uploadRes.status}`);
    }

    console.log('Upload succeeded.');
    console.log(`image_url: ${data.image_url}`);
}

run().catch((error) => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
