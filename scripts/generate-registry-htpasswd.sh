#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <username> <password>"
  echo "Example: $0 registryadmin StrongPassword123!"
  exit 1
fi

USERNAME="$1"
PASSWORD="$2"
AUTH_DIR="ops/registry/auth"
AUTH_FILE="${AUTH_DIR}/htpasswd"

mkdir -p "$AUTH_DIR"

if command -v htpasswd >/dev/null 2>&1; then
  htpasswd -Bbn "$USERNAME" "$PASSWORD" > "$AUTH_FILE"
elif command -v openssl >/dev/null 2>&1; then
  printf '%s:%s\n' "$USERNAME" "$(openssl passwd -apr1 "$PASSWORD")" > "$AUTH_FILE"
else
  echo "Neither htpasswd nor openssl is available."
  echo "Install apache2-utils/httpd-tools or openssl, then rerun."
  exit 1
fi

chmod 600 "$AUTH_FILE"
echo "Generated: $AUTH_FILE"
