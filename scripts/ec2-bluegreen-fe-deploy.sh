#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <ec2-host> <ec2-user> <dockerhub-user> <tag> [ssh-key-path]"
  echo "Required env: API_URL"
  echo "Optional env: FILE_UPLOAD_API_URL"
  exit 1
fi

if [[ -z "${API_URL:-}" ]]; then
  echo "API_URL env is required"
  exit 1
fi

EC2_HOST="$1"
EC2_USER="$2"
DOCKERHUB_USER="$3"
TAG="$4"
SSH_KEY_PATH="${5:-}"
FILE_UPLOAD_API_URL="${FILE_UPLOAD_API_URL:-}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "$SSH_KEY_PATH" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

ssh "${SSH_OPTS[@]}" "${EC2_USER}@${EC2_HOST}" \
  "DOCKERHUB_USER='${DOCKERHUB_USER}' TAG='${TAG}' API_URL='${API_URL}' FILE_UPLOAD_API_URL='${FILE_UPLOAD_API_URL}' bash -s" <<'REMOTE_EOF'
set -euo pipefail

REMOTE_DIR="$HOME/community-fe-bluegreen"
NETWORK_NAME="community-fe-bg-net"
PROXY_CONTAINER="community-fe-proxy"
ACTIVE_SLOT_FILE="$REMOTE_DIR/active_slot"

if ! command -v docker >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y docker
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y docker
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y docker.io
  else
    echo "Unsupported package manager: cannot install docker" >&2
    exit 1
  fi
fi

sudo systemctl enable --now docker
mkdir -p "$REMOTE_DIR/nginx"

if ! sudo docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  sudo docker network create "$NETWORK_NAME" >/dev/null
fi

ACTIVE_SLOT="blue"
if [[ -f "$ACTIVE_SLOT_FILE" ]]; then
  ACTIVE_SLOT="$(cat "$ACTIVE_SLOT_FILE")"
fi

NEXT_SLOT="green"
if [[ "$ACTIVE_SLOT" == "green" ]]; then
  NEXT_SLOT="blue"
fi

NEXT_CONTAINER="community-fe-${NEXT_SLOT}"
ACTIVE_CONTAINER="community-fe-${ACTIVE_SLOT}"
IMAGE="${DOCKERHUB_USER}/community-frontend:${TAG}"

echo "[1/6] Pull image: $IMAGE"
sudo docker pull "$IMAGE" >/dev/null

echo "[2/6] Start next slot container: ${NEXT_CONTAINER}"
sudo docker rm -f "$NEXT_CONTAINER" >/dev/null 2>&1 || true
sudo docker run -d \
  --name "$NEXT_CONTAINER" \
  --restart unless-stopped \
  --network "$NETWORK_NAME" \
  -e PORT=3001 \
  -e API_URL="$API_URL" \
  -e FILE_UPLOAD_API_URL="$FILE_UPLOAD_API_URL" \
  "$IMAGE" >/dev/null

echo "[3/6] Health check next slot"
for i in $(seq 1 30); do
  if sudo docker run --rm --network "$NETWORK_NAME" curlimages/curl:8.12.1 -fsS "http://${NEXT_CONTAINER}:3001/health" >/dev/null; then
    HEALTH_OK="true"
    break
  fi
  HEALTH_OK="false"
  sleep 2
done

if [[ "${HEALTH_OK}" != "true" ]]; then
  echo "Next slot health check failed: ${NEXT_CONTAINER}" >&2
  sudo docker logs "$NEXT_CONTAINER" --tail 200 || true
  exit 1
fi

echo "[4/6] Switch Nginx upstream to ${NEXT_CONTAINER}"
cat > "$REMOTE_DIR/nginx/default.conf" <<NGINX_CONF
server {
  listen 80;
  server_name _;

  location /health {
    proxy_pass http://${NEXT_CONTAINER}:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location / {
    proxy_pass http://${NEXT_CONTAINER}:3001;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX_CONF

if ! sudo docker ps -a --format '{{.Names}}' | grep -qx "$PROXY_CONTAINER"; then
  sudo docker run -d \
    --name "$PROXY_CONTAINER" \
    --restart unless-stopped \
    --network "$NETWORK_NAME" \
    -p 80:80 \
    -v "$REMOTE_DIR/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:1.27-alpine >/dev/null
else
  sudo docker start "$PROXY_CONTAINER" >/dev/null
  sudo docker exec "$PROXY_CONTAINER" nginx -s reload >/dev/null
fi

echo "$NEXT_SLOT" > "$ACTIVE_SLOT_FILE"

echo "[5/6] Keep previous slot for rollback readiness: ${ACTIVE_CONTAINER}"
if [[ "$ACTIVE_CONTAINER" != "$NEXT_CONTAINER" ]]; then
  sudo docker ps --format '{{.Names}}' | grep -qx "$ACTIVE_CONTAINER" && echo "Previous slot running: ${ACTIVE_CONTAINER}" || true
fi

echo "[6/6] Result"
echo "Active slot: $(cat "$ACTIVE_SLOT_FILE")"
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' | grep -E '^community-fe-|^community-fe-proxy' || true
REMOTE_EOF
