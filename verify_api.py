import requests
import sys

BASE_URL = "http://localhost:8000"

def test_api():
    session = requests.Session()
    
    # 1. Login
    print("1. Logging in...")
    login_payload = {
        "email": "devAdmin@adapterz.kr",
        "password": "Password1234!"
    }
    try:
        res = session.post(f"{BASE_URL}/auth/login", json=login_payload)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to backend at http://localhost:8000")
        sys.exit(1)

    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        sys.exit(1)
    print("Login successful.")

    # 2. Create Post
    print("2. Creating Post...")
    create_payload = {
        "title": "API Test Title",
        "content": "API Test Content",
        "image_url": None
    }
    res = session.post(f"{BASE_URL}/posts", json=create_payload)
    if res.status_code != 201:
        print(f"Create Post failed: {res.text}")
        sys.exit(1)
    
    post_data = res.json()["data"]
    post_id = post_data["id"]
    print(f"Post created: ID {post_id}")

    # 3. Update Post
    print("3. Updating Post...")
    update_payload = {
        "title": "Updated Title",
        "content": "Updated Content",
        "image_url": None
    }
    res = session.put(f"{BASE_URL}/posts/{post_id}", json=update_payload)
    if res.status_code != 200:
        print(f"Update Post failed: {res.text}")
        sys.exit(1)
    
    updated_data = res.json()["data"]
    if updated_data["title"] != "Updated Title":
        print("Update verification failed: Title mismatch")
        sys.exit(1)
        
    print("Post updated successfully.")
    
    # 4. Cleanup (Delete Post)
    print("4. Cleaning up...")
    res = session.delete(f"{BASE_URL}/posts/{post_id}")
    if res.status_code != 200:
        print("Cleanup failed.")
    else:
        print("Cleanup successful.")

if __name__ == "__main__":
    try:
        test_api()
        print("\nAll API tests passed!")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        sys.exit(1)
