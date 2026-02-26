import os
import random
import sys
import time

import requests

BASE_URL = os.getenv("API_URL", "http://127.0.0.1:8000").rstrip("/")
TEST_PASSWORD = os.getenv("VERIFY_PASSWORD", "Password1234!")


def _assert(condition, message):
    if not condition:
        raise AssertionError(message)


def _build_unique_user():
    seed = f"{int(time.time() * 1000)}{random.randint(1000, 9999)}"
    email = f"fe-integration-{seed}@example.com"
    nickname = f"u{seed[-9:]}"  # 1~10 chars
    return {"email": email, "nickname": nickname}


def _request_json(session, method, path, token=None, payload=None, expected=(200,)):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    response = session.request(
        method=method,
        url=f"{BASE_URL}{path}",
        headers=headers,
        json=payload,
        timeout=10,
    )

    try:
        body = response.json()
    except ValueError:
        body = {"message": response.text}

    if response.status_code not in expected:
        raise RuntimeError(f"{method} {path} failed ({response.status_code})\n{body}")

    return body


def test_api():
    session = requests.Session()
    user = _build_unique_user()
    updated_nickname = f"{user['nickname'][:8]}x"
    tag = f"tag{str(int(time.time() * 1000))[-5:]}"

    access_token = None
    refresh_token = None
    post_id = None
    comment_id = None

    try:
        print("1. Signing up...")
        _request_json(
            session,
            "POST",
            "/auth/signup",
            payload={
                "email": user["email"],
                "password": TEST_PASSWORD,
                "nickname": user["nickname"],
            },
            expected=(201,),
        )
        print("Signup successful.")

        print("2. Logging in...")
        login_payload = _request_json(
            session,
            "POST",
            "/auth/login",
            payload={
                "email": user["email"],
                "password": TEST_PASSWORD,
            },
        )
        token_data = login_payload.get("data", {})
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        _assert(access_token, "Missing access_token in login response.")
        _assert(refresh_token, "Missing refresh_token in login response.")
        print("Login successful.")

        print("3. Fetching my profile...")
        me_payload = _request_json(session, "GET", "/users/me", token=access_token)
        _assert(me_payload.get("data", {}).get("email") == user["email"], "Profile email mismatch.")
        print("Profile fetch successful.")

        print("4. Updating profile nickname...")
        profile_payload = _request_json(
            session,
            "PATCH",
            "/users/me",
            token=access_token,
            payload={"nickname": updated_nickname},
        )
        _assert(
            profile_payload.get("data", {}).get("nickname") == updated_nickname,
            "Nickname update failed.",
        )
        print("Profile update successful.")

        print("5. Creating post...")
        create_payload = _request_json(
            session,
            "POST",
            "/posts",
            token=access_token,
            payload={
                "title": "Frontend Integration Test",
                "content": "verify_api.py integrated flow test",
                "image_url": None,
                "tags": [tag, "frontend"],
            },
            expected=(201,),
        )
        post_id = create_payload.get("data", {}).get("id")
        _assert(post_id, "Post ID missing after create.")
        print(f"Post created: {post_id}")

        print("6. Reading post list with tag filter...")
        list_payload = _request_json(
            session,
            "GET",
            f"/posts?page=1&limit=10&sort=latest&tag={tag}",
            token=access_token,
        )
        listed_posts = list_payload.get("data", [])
        _assert(any(post.get("id") == post_id for post in listed_posts), "Created post not found in filtered list.")
        print("List API successful.")

        print("7. Reading post detail...")
        detail_payload = _request_json(session, "GET", f"/posts/{post_id}", token=access_token)
        _assert(detail_payload.get("data", {}).get("id") == post_id, "Post detail mismatch.")
        print("Post detail successful.")

        print("8. Like/Unlike post...")
        _request_json(session, "POST", f"/posts/{post_id}/likes", token=access_token, expected=(201,))
        _request_json(session, "DELETE", f"/posts/{post_id}/likes", token=access_token)
        print("Like/Unlike successful.")

        print("9. Comment CRUD...")
        create_comment_payload = _request_json(
            session,
            "POST",
            f"/posts/{post_id}/comments",
            token=access_token,
            payload={"content": "integration comment"},
            expected=(201,),
        )
        comment_id = create_comment_payload.get("data", {}).get("id")
        _assert(comment_id, "Comment ID missing after create.")

        _request_json(
            session,
            "PUT",
            f"/posts/{post_id}/comments/{comment_id}",
            token=access_token,
            payload={"content": "integration comment updated"},
        )
        _request_json(session, "DELETE", f"/posts/{post_id}/comments/{comment_id}", token=access_token)
        comment_id = None
        print("Comment CRUD successful.")

        print("10. Updating post...")
        update_payload = _request_json(
            session,
            "PUT",
            f"/posts/{post_id}",
            token=access_token,
            payload={
                "title": "Integration Test Updated",
                "content": "updated content",
                "image_url": None,
                "tags": [tag, "updated"],
            },
        )
        _assert(
            update_payload.get("data", {}).get("title") == "Integration Test Updated",
            "Post update verification failed.",
        )
        print("Post update successful.")

        print("11. Reading trending posts...")
        _request_json(session, "GET", "/posts/trending?days=7&limit=5", token=access_token)
        print("Trending API successful.")

        print("12. Deleting post...")
        _request_json(session, "DELETE", f"/posts/{post_id}", token=access_token)
        post_id = None
        print("Post delete successful.")

        print("13. Withdrawing user...")
        _request_json(session, "DELETE", "/users/me", token=access_token)
        print("User withdrawal successful.")

        print("14. Logging out...")
        _request_json(
            session,
            "POST",
            "/auth/logout",
            payload={"refresh_token": refresh_token},
        )
        refresh_token = None
        print("Logout successful.")

        print("\nAll API integration checks passed.")
    finally:
        if comment_id and post_id and access_token:
            try:
                _request_json(
                    session,
                    "DELETE",
                    f"/posts/{post_id}/comments/{comment_id}",
                    token=access_token,
                    expected=(200, 401, 403, 404),
                )
            except Exception as cleanup_error:
                print(f"Cleanup warning (comment): {cleanup_error}")

        if post_id and access_token:
            try:
                _request_json(
                    session,
                    "DELETE",
                    f"/posts/{post_id}",
                    token=access_token,
                    expected=(200, 401, 403, 404),
                )
            except Exception as cleanup_error:
                print(f"Cleanup warning (post): {cleanup_error}")

        if refresh_token:
            try:
                _request_json(
                    session,
                    "POST",
                    "/auth/logout",
                    payload={"refresh_token": refresh_token},
                    expected=(200, 400, 401),
                )
            except Exception as cleanup_error:
                print(f"Cleanup warning (logout): {cleanup_error}")


if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to backend at {BASE_URL}")
        sys.exit(1)
    except Exception as e:
        print(f"\nIntegration test failed: {e}")
        sys.exit(1)
