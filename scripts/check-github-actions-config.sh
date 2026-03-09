#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-80-hours-a-week/2-sungjin-community-fe}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

contains_name() {
  local target="$1"
  shift
  local item
  for item in "$@"; do
    if [[ "$item" == "$target" ]]; then
      return 0
    fi
  done
  return 1
}

print_group() {
  local title="$1"
  local current_ref="$2"
  local required_ref="$3"
  local optional_ref="$4"
  local -n current_names="$current_ref"
  local -n required_names="$required_ref"
  local -n optional_names="$optional_ref"
  local name
  local missing=0

  echo
  echo "[$title]"

  for name in "${required_names[@]}"; do
    if contains_name "$name" "${current_names[@]}"; then
      echo "  OK   $name"
    else
      echo "  MISS $name"
      missing=1
    fi
  done

  if (( ${#optional_names[@]} > 0 )); then
    echo "  -- optional --"
    for name in "${optional_names[@]}"; do
      if contains_name "$name" "${current_names[@]}"; then
        echo "  OK   $name"
      else
        echo "  SKIP $name"
      fi
    done
  fi

  return "$missing"
}

require_command gh

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI auth is required. Run: gh auth login" >&2
  exit 1
fi

repo_secret_required=(
  "DOCKERHUB_USER"
  "DOCKERHUB_PAT"
  "STAGING_AWS_ACCESS_KEY_ID"
  "STAGING_AWS_SECRET_ACCESS_KEY"
  "PROD_AWS_ACCESS_KEY_ID"
  "PROD_AWS_SECRET_ACCESS_KEY"
)
repo_secret_optional=(
  "BACKEND_REPO_TOKEN"
  "EC2_HOST"
  "EC2_USER"
  "EC2_SSH_PRIVATE_KEY"
)

repo_variable_required=(
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
  "PROD_ECR_FRONTEND_REPOSITORY"
  "PROD_ECR_BACKEND_REPOSITORY"
  "PROD_ECS_CLUSTER_NAME"
  "PROD_ECS_FRONTEND_SERVICE"
  "PROD_ECS_BACKEND_SERVICE"
  "PROD_ECS_FRONTEND_TASK_FAMILY"
  "PROD_ECS_BACKEND_TASK_FAMILY"
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
)
repo_variable_optional=(
  "STAGING_ECS_FRONTEND_CONTAINER_NAME"
  "STAGING_ECS_BACKEND_CONTAINER_NAME"
  "PROD_ECS_FRONTEND_CONTAINER_NAME"
  "PROD_ECS_BACKEND_CONTAINER_NAME"
  "STAGING_COMPOSE_FILE"
  "PROD_COMPOSE_FILE"
  "STAGING_API_URL"
  "PROD_API_URL"
  "STAGING_FILE_UPLOAD_API_URL"
  "PROD_FILE_UPLOAD_API_URL"
)

staging_secret_required=(
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
staging_secret_optional=()

production_secret_required=(
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
production_secret_optional=()

mapfile -t repo_secrets < <(gh secret list -R "$REPO" --json name --jq '.[].name')
mapfile -t repo_variables < <(gh variable list -R "$REPO" --json name --jq '.[].name')
mapfile -t staging_secrets < <(gh secret list -R "$REPO" --env staging --json name --jq '.[].name')
mapfile -t production_secrets < <(gh secret list -R "$REPO" --env production --json name --jq '.[].name')

overall_missing=0

print_group "Repository Secrets" repo_secrets repo_secret_required repo_secret_optional || overall_missing=1
print_group "Repository Variables" repo_variables repo_variable_required repo_variable_optional || overall_missing=1
print_group "Environment Secrets: staging" staging_secrets staging_secret_required staging_secret_optional || overall_missing=1
print_group "Environment Secrets: production" production_secrets production_secret_required production_secret_optional || overall_missing=1

echo
if (( overall_missing == 0 )); then
  echo "All required GitHub Actions settings are present for this repo."
else
  echo "Missing required GitHub Actions settings were found."
  echo "Fill values using docs/github-actions-secrets-vars-template.md and rerun this script."
  exit 1
fi
