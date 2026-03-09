#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/import-github-actions-env-file.sh [env_file] [base_dir]

Reads a single values file and regenerates:
  ops/github-actions-input/repo-secrets
  ops/github-actions-input/repo-vars
  ops/github-actions-input/env-staging-secrets
  ops/github-actions-input/env-production-secrets

Default env file:
  ops/github-actions-input/values.env

Typical flow:
  1. Edit ops/github-actions-input/values.env
  2. ./scripts/import-github-actions-env-file.sh
  3. ./scripts/apply-github-actions-config.sh
  4. ./scripts/check-github-actions-config.sh
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/ops/github-actions-input/values.env}"
BASE_DIR="${2:-$ROOT_DIR/ops/github-actions-input}"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Values file not found: $ENV_FILE" >&2
  exit 1
fi

mkdir -p \
  "$BASE_DIR/repo-secrets" \
  "$BASE_DIR/repo-vars" \
  "$BASE_DIR/env-staging-secrets" \
  "$BASE_DIR/env-production-secrets"

# Regenerate outputs from the single source file to avoid stale entries.
find "$BASE_DIR/repo-secrets" -maxdepth 1 -type f ! -name '.DS_Store' -delete
find "$BASE_DIR/repo-vars" -maxdepth 1 -type f ! -name '.DS_Store' -delete
find "$BASE_DIR/env-staging-secrets" -maxdepth 1 -type f ! -name '.DS_Store' -delete
find "$BASE_DIR/env-production-secrets" -maxdepth 1 -type f ! -name '.DS_Store' -delete

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

write_raw_value() {
  local key="$1"
  local output_dir="$2"
  local value="${!key:-}"

  if [[ -n "$value" ]]; then
    printf '%s' "$value" > "$output_dir/$key"
  fi
}

write_file_or_raw_value() {
  local key="$1"
  local output_dir="$2"
  local file_key="${key}_FILE"
  local file_path="${!file_key:-}"
  local value="${!key:-}"

  if [[ -n "$file_path" ]]; then
    if [[ ! -f "$file_path" ]]; then
      echo "Referenced file not found for $file_key: $file_path" >&2
      exit 1
    fi
    cp "$file_path" "$output_dir/$key"
    return
  fi

  if [[ -n "$value" ]]; then
    printf '%s' "$value" > "$output_dir/$key"
  fi
}

repo_secrets=(
  "DOCKERHUB_USER"
  "DOCKERHUB_PAT"
  "BACKEND_REPO_TOKEN"
  "STAGING_AWS_ACCESS_KEY_ID"
  "STAGING_AWS_SECRET_ACCESS_KEY"
  "PROD_AWS_ACCESS_KEY_ID"
  "PROD_AWS_SECRET_ACCESS_KEY"
)

repo_vars=(
  "BACKEND_REPO"
  "BACKEND_REF"
  "STAGING_AWS_REGION"
  "PROD_AWS_REGION"
  "STAGING_ECR_FRONTEND_REPOSITORY"
  "STAGING_ECR_BACKEND_REPOSITORY"
  "STAGING_ECS_CLUSTER_NAME"
  "STAGING_ECS_FRONTEND_SERVICE"
  "STAGING_ECS_BACKEND_SERVICE"
  "STAGING_ECS_FRONTEND_TASK_FAMILY"
  "STAGING_ECS_BACKEND_TASK_FAMILY"
  "STAGING_ECS_FRONTEND_CONTAINER_NAME"
  "STAGING_ECS_BACKEND_CONTAINER_NAME"
  "PROD_ECR_FRONTEND_REPOSITORY"
  "PROD_ECR_BACKEND_REPOSITORY"
  "PROD_ECS_CLUSTER_NAME"
  "PROD_ECS_FRONTEND_SERVICE"
  "PROD_ECS_BACKEND_SERVICE"
  "PROD_ECS_FRONTEND_TASK_FAMILY"
  "PROD_ECS_BACKEND_TASK_FAMILY"
  "PROD_ECS_FRONTEND_CONTAINER_NAME"
  "PROD_ECS_BACKEND_CONTAINER_NAME"
  "K8S_API_URL_STAGING"
  "K8S_API_URL_PROD"
  "K8S_FILE_UPLOAD_API_URL_STAGING"
  "K8S_FILE_UPLOAD_API_URL_PROD"
  "K8S_DATABASE_URL_STAGING"
  "K8S_DATABASE_URL_PROD"
  "K8S_CORS_ALLOW_ORIGINS_STAGING"
  "K8S_CORS_ALLOW_ORIGINS_PROD"
  "K8S_INGRESS_CLASS_NAME_STAGING"
  "K8S_INGRESS_CLASS_NAME_PROD"
  "STAGING_COMPOSE_FILE"
  "PROD_COMPOSE_FILE"
  "STAGING_API_URL"
  "PROD_API_URL"
  "STAGING_FILE_UPLOAD_API_URL"
  "PROD_FILE_UPLOAD_API_URL"
)

staging_env_secrets=(
  "STAGING_EC2_HOST"
  "STAGING_EC2_USER"
  "STAGING_EC2_SSH_PRIVATE_KEY"
  "KUBE_CONFIG_DATA_STAGING"
  "STAGING_FE_BLUEGREEN_EC2_HOST"
  "STAGING_FE_BLUEGREEN_EC2_USER"
  "STAGING_FE_BLUEGREEN_EC2_SSH_PRIVATE_KEY"
  "STAGING_FE_BLUEGREEN_API_URL"
  "STAGING_FE_BLUEGREEN_FILE_UPLOAD_API_URL"
)

production_env_secrets=(
  "PROD_EC2_HOST"
  "PROD_EC2_USER"
  "PROD_EC2_SSH_PRIVATE_KEY"
  "KUBE_CONFIG_DATA_PROD"
  "PROD_FE_BLUEGREEN_EC2_HOST"
  "PROD_FE_BLUEGREEN_EC2_USER"
  "PROD_FE_BLUEGREEN_EC2_SSH_PRIVATE_KEY"
  "PROD_FE_BLUEGREEN_API_URL"
  "PROD_FE_BLUEGREEN_FILE_UPLOAD_API_URL"
)

for key in "${repo_secrets[@]}"; do
  write_raw_value "$key" "$BASE_DIR/repo-secrets"
done

for key in "${repo_vars[@]}"; do
  write_raw_value "$key" "$BASE_DIR/repo-vars"
done

for key in "${staging_env_secrets[@]}"; do
  write_file_or_raw_value "$key" "$BASE_DIR/env-staging-secrets"
done

for key in "${production_env_secrets[@]}"; do
  write_file_or_raw_value "$key" "$BASE_DIR/env-production-secrets"
done

echo "Generated GitHub Actions input files from: $ENV_FILE"
echo "Next:"
echo "  ./scripts/apply-github-actions-config.sh"
echo "  ./scripts/check-github-actions-config.sh"
