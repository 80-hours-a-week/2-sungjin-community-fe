#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <destroy|rebuild>"
  exit 1
fi

MODE="$1"
if [[ "$MODE" != "destroy" && "$MODE" != "rebuild" ]]; then
  echo "Invalid mode: $MODE"
  echo "Allowed: destroy, rebuild"
  exit 1
fi

if [[ "${CONFIRM_DESTROY_PROD:-}" != "DESTROY_PROD" ]]; then
  echo "Set CONFIRM_DESTROY_PROD=DESTROY_PROD to proceed."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$SCRIPT_DIR/../infra/aws-bigbang"

if [[ ! -d "$TF_DIR" ]]; then
  echo "Terraform directory not found: $TF_DIR"
  exit 1
fi

cd "$TF_DIR"
terraform init -input=false
terraform validate
terraform destroy -auto-approve -input=false

if [[ "$MODE" == "rebuild" ]]; then
  terraform apply -auto-approve -input=false
fi
