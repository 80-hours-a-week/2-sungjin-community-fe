const BASE_URL = "http://127.0.0.1:8000";

async function testApi() {
    try {
        // 1. Login
        console.log("1. Logging in...");
        const loginPayload = {
            email: "devAdmin@adapterz.kr",
            password: "Password1234!"
        };

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginPayload)
        });

        if (!loginRes.ok) {
            console.error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
            process.exit(1);
        }

        // Get cookie from response headers if possible, but fetch in Node might not handle set-cookie automatically for subsequent requests unless we parse it.
        // However, the backend returns "session_id" in the cookie.
        // Node's native fetch doesn't automatically persist cookies like a browser.
        // We need to manually handle the cookie.

        const cookie = loginRes.headers.get('set-cookie');
        if (!cookie) {
            console.error("Login successful but no Set-Cookie header received.");
            // Depending on backend, maybe it's fine if we don't need auth for public posts? 
            // But create_post likely needs auth.
        }
        console.log("Login successful.");

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': cookie || ''
        };

        // 2. Create Post
        console.log("2. Creating Post...");
        const createPayload = {
            title: "API Test Title",
            content: "API Test Content",
            image_url: null
        };

        const createRes = await fetch(`${BASE_URL}/posts`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(createPayload)
        });

        if (!createRes.ok) {
            const errorText = await createRes.text();
            console.error(`Create Post failed: ${createRes.status} ${errorText}`);
            process.exit(1);
        }

        const createData = await createRes.json();
        const postId = createData.data.id;
        console.log(`Post created: ID ${postId}`);

        // 3. Update Post
        console.log("3. Updating Post...");
        const updatePayload = {
            title: "Updated Title",
            content: "Updated Content",
            image_url: null
        };

        const updateRes = await fetch(`${BASE_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(updatePayload)
        });

        if (!updateRes.ok) {
            const errorText = await updateRes.text();
            console.error(`Update Post failed: ${updateRes.status} ${errorText}`);
            process.exit(1);
        }

        const updateData = await updateRes.json();
        if (updateData.data.title !== "Updated Title") {
            console.error("Update verification failed: Title mismatch");
            process.exit(1);
        }
        console.log("Post updated successfully.");

        // 4. Cleanup
        console.log("4. Cleaning up...");
        const deleteRes = await fetch(`${BASE_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: headers
        });

        if (!deleteRes.ok) {
            console.error("Cleanup failed.");
        } else {
            console.log("Cleanup successful.");
        }

    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}

testApi();
