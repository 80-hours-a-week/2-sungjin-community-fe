#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_DIR="${1:-$ROOT_DIR/ops/github-actions-input}"

mkdir -p \
  "$BASE_DIR/repo-secrets" \
  "$BASE_DIR/repo-vars" \
  "$BASE_DIR/env-staging-secrets" \
  "$BASE_DIR/env-production-secrets"

echo "Created input directories under: $BASE_DIR"
echo "- $BASE_DIR/repo-secrets"
echo "- $BASE_DIR/repo-vars"
echo "- $BASE_DIR/env-staging-secrets"
echo "- $BASE_DIR/env-production-secrets"
