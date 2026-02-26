#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <dockerhub-username> <tag> [platforms]"
  echo "Example (multi-arch): $0 sungjin9288 v1.0.0"
  echo "Example (arm64 only): $0 sungjin9288 v1.0.0 linux/arm64"
  exit 1
fi

DOCKERHUB_USER="$1"
TAG="$2"
PLATFORMS="${3:-linux/amd64,linux/arm64}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_CONTEXT="${BACKEND_CONTEXT:-$ROOT_DIR/../2-sungjin-community-be}"

FE_IMAGE_REMOTE="${DOCKERHUB_USER}/community-frontend:${TAG}"
BE_IMAGE_REMOTE="${DOCKERHUB_USER}/community-backend:${TAG}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found"
  exit 1
fi

if ! docker buildx version >/dev/null 2>&1; then
  echo "docker buildx is required for multi-arch builds"
  exit 1
fi

BUILDER_NAME="community-multiarch"
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  docker buildx create --name "$BUILDER_NAME" --driver docker-container --use >/dev/null
else
  docker buildx use "$BUILDER_NAME" >/dev/null
fi
docker buildx inspect --bootstrap >/dev/null

if [[ ! -f "$ROOT_DIR/Dockerfile" ]]; then
  echo "Frontend Dockerfile not found: $ROOT_DIR/Dockerfile"
  exit 1
fi

if [[ ! -f "$BACKEND_CONTEXT/Dockerfile" ]]; then
  echo "Backend Dockerfile not found: $BACKEND_CONTEXT/Dockerfile"
  echo "Set BACKEND_CONTEXT to your backend repo path and retry."
  exit 1
fi

echo "Build/Pull target platforms: $PLATFORMS"
echo "Frontend image: $FE_IMAGE_REMOTE"
echo "Backend image:  $BE_IMAGE_REMOTE"

docker buildx build \
  --platform "$PLATFORMS" \
  -t "$FE_IMAGE_REMOTE" \
  --push \
  "$ROOT_DIR"

docker buildx build \
  --platform "$PLATFORMS" \
  -t "$BE_IMAGE_REMOTE" \
  --push \
  "$BACKEND_CONTEXT"

echo "Pushed images:"
echo "- $FE_IMAGE_REMOTE"
echo "- $BE_IMAGE_REMOTE"
