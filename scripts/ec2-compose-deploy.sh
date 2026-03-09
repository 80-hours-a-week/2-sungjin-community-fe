#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <ec2-host> <ec2-user> <dockerhub-user> <tag> [ssh-key-path]"
  echo "Example: $0 13.124.45.148 ec2-user sungjin9288 v1.0.0 ~/.ssh/community-prod-key.pem"
  echo "Optional env: COMPOSE_FILE=docker-compose.reverse-proxy.deploy.yml"
  echo "Optional env: API_URL=http://<host>:8000 FILE_UPLOAD_API_URL=https://<upload-api>"
  exit 1
fi

EC2_HOST="$1"
EC2_USER="$2"
DOCKERHUB_USER="$3"
TAG="$4"
SSH_KEY_PATH="${5:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "$SSH_KEY_PATH" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY_PATH")
fi

ssh "${SSH_OPTS[@]}" "${EC2_USER}@${EC2_HOST}" "mkdir -p ~/community-compose/ops/nginx"

scp "${SSH_OPTS[@]}" "$COMPOSE_FILE" "${EC2_USER}@${EC2_HOST}:~/community-compose/docker-compose.deploy.yml"
scp "${SSH_OPTS[@]}" ops/nginx/reverse-proxy.conf "${EC2_USER}@${EC2_HOST}:~/community-compose/ops/nginx/reverse-proxy.conf"

ssh "${SSH_OPTS[@]}" "${EC2_USER}@${EC2_HOST}" "bash -lc '
  set -euo pipefail
  cd ~/community-compose
  export DOCKERHUB_USER=${DOCKERHUB_USER}
  export TAG=${TAG}
  export API_URL="${API_URL:-}"
  export FILE_UPLOAD_API_URL="${FILE_UPLOAD_API_URL:-}"
  if ! command -v docker >/dev/null 2>&1; then
    # Keep small EC2 root disks from failing package installs.
    sudo journalctl --vacuum-time=3d >/dev/null 2>&1 || true
    if command -v dnf >/dev/null 2>&1; then
      sudo dnf clean all >/dev/null 2>&1 || true
      sudo rm -rf /var/cache/dnf/* >/dev/null 2>&1 || true
    elif command -v yum >/dev/null 2>&1; then
      sudo yum clean all >/dev/null 2>&1 || true
      sudo rm -rf /var/cache/yum/* >/dev/null 2>&1 || true
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get clean >/dev/null 2>&1 || true
      sudo rm -rf /var/lib/apt/lists/* /var/cache/apt/* >/dev/null 2>&1 || true
    fi

    if command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y docker
    elif command -v yum >/dev/null 2>&1; then
      sudo yum install -y docker
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update -y
      sudo apt-get install -y docker.io docker-compose-plugin
    else
      echo \"Unsupported package manager: cannot install docker\" >&2
      exit 1
    fi
  fi

  sudo systemctl enable --now docker

  if ! sudo docker compose version >/dev/null 2>&1; then
    if command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y docker-compose-plugin >/dev/null 2>&1 || true
    elif command -v yum >/dev/null 2>&1; then
      sudo yum install -y docker-compose-plugin >/dev/null 2>&1 || true
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get install -y docker-compose-plugin >/dev/null 2>&1 || true
    fi

    # Fallback: install compose plugin binary directly.
    if ! sudo docker compose version >/dev/null 2>&1; then
      sudo mkdir -p /usr/local/lib/docker/cli-plugins
      sudo curl -fsSL \
        https://github.com/docker/compose/releases/download/v2.39.3/docker-compose-linux-x86_64 \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
      sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    fi
  fi

  sudo docker compose version
  sudo DOCKERHUB_USER=\"$DOCKERHUB_USER\" TAG=\"$TAG\" API_URL=\"$API_URL\" FILE_UPLOAD_API_URL=\"$FILE_UPLOAD_API_URL\" docker compose -f docker-compose.deploy.yml pull
  sudo DOCKERHUB_USER=\"$DOCKERHUB_USER\" TAG=\"$TAG\" API_URL=\"$API_URL\" FILE_UPLOAD_API_URL=\"$FILE_UPLOAD_API_URL\" docker compose -f docker-compose.deploy.yml up -d
  sudo DOCKERHUB_USER=\"$DOCKERHUB_USER\" TAG=\"$TAG\" API_URL=\"$API_URL\" FILE_UPLOAD_API_URL=\"$FILE_UPLOAD_API_URL\" docker compose -f docker-compose.deploy.yml ps
'"
