#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <dockerhub-username> <tag>"
  echo "Example: $0 sungjin9288 v1.0.0"
  exit 1
fi

DOCKERHUB_USER="$1"
TAG="$2"

FE_IMAGE_LOCAL="sungjin9288/community-frontend:local"
BE_IMAGE_LOCAL="sungjin9288/community-backend:local"

FE_IMAGE_REMOTE="${DOCKERHUB_USER}/community-frontend:${TAG}"
BE_IMAGE_REMOTE="${DOCKERHUB_USER}/community-backend:${TAG}"

docker tag "$FE_IMAGE_LOCAL" "$FE_IMAGE_REMOTE"
docker tag "$BE_IMAGE_LOCAL" "$BE_IMAGE_REMOTE"

docker push "$FE_IMAGE_REMOTE"
docker push "$BE_IMAGE_REMOTE"

echo "Pushed images:"
echo "- $FE_IMAGE_REMOTE"
echo "- $BE_IMAGE_REMOTE"
