#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/apply-github-actions-config.sh [repo] [base_dir]

Arguments:
  repo      GitHub repository slug. Default: 80-hours-a-week/2-sungjin-community-fe
  base_dir  Directory containing config files.
            Default: ./ops/github-actions-input

Expected layout:
  ops/github-actions-input/
    repo-secrets/
      DOCKERHUB_PAT
      STAGING_AWS_ACCESS_KEY_ID
      ...
    repo-vars/
      BACKEND_REPO
      STAGING_AWS_REGION
      ...
    env-staging-secrets/
      STAGING_EC2_HOST
      KUBE_CONFIG_DATA_STAGING
      ...
    env-production-secrets/
      PROD_EC2_HOST
      KUBE_CONFIG_DATA_PROD
      ...

Each file name becomes the GitHub secret/variable name.
The file content becomes the value. Multiline values are supported.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

apply_secret_dir() {
  local repo="$1"
  local env_name="$2"
  local dir="$3"
  local file
  local name

  [[ -d "$dir" ]] || return 0

  while IFS= read -r -d '' file; do
    name="$(basename "$file")"
    if [[ -n "$env_name" ]]; then
      echo "Setting env secret [$env_name] $name"
      gh secret set "$name" -R "$repo" --env "$env_name" < "$file"
    else
      echo "Setting repo secret $name"
      gh secret set "$name" -R "$repo" < "$file"
    fi
  done < <(find "$dir" -maxdepth 1 -type f ! -name '.DS_Store' -print0 | sort -z)
}

apply_variable_dir() {
  local repo="$1"
  local dir="$2"
  local file
  local name

  [[ -d "$dir" ]] || return 0

  while IFS= read -r -d '' file; do
    name="$(basename "$file")"
    echo "Setting repo variable $name"
    gh variable set "$name" -R "$repo" --body "$(cat "$file")"
  done < <(find "$dir" -maxdepth 1 -type f ! -name '.DS_Store' -print0 | sort -z)
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

REPO="${1:-80-hours-a-week/2-sungjin-community-fe}"
BASE_DIR="${2:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/ops/github-actions-input}"

require_command gh

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI auth is required. Run: gh auth login" >&2
  exit 1
fi

echo "Applying GitHub Actions config to: $REPO"
echo "Using input directory: $BASE_DIR"

apply_secret_dir "$REPO" "" "$BASE_DIR/repo-secrets"
apply_variable_dir "$REPO" "$BASE_DIR/repo-vars"
apply_secret_dir "$REPO" "staging" "$BASE_DIR/env-staging-secrets"
apply_secret_dir "$REPO" "production" "$BASE_DIR/env-production-secrets"

echo "Completed."
echo "Run ./scripts/check-github-actions-config.sh \"$REPO\" to verify."
