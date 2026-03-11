#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <hostname-or-ip> [days]"
  echo "Example: $0 13.124.45.148 365"
  exit 1
fi

HOST="$1"
DAYS="${2:-365}"
CERT_DIR="ops/portainer/certs"
CRT_PATH="${CERT_DIR}/portainer.crt"
KEY_PATH="${CERT_DIR}/portainer.key"

mkdir -p "$CERT_DIR"

if [[ "$HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  SAN="IP:${HOST},IP:127.0.0.1"
else
  SAN="DNS:${HOST},DNS:localhost,IP:127.0.0.1"
fi

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$KEY_PATH" \
  -out "$CRT_PATH" \
  -days "$DAYS" \
  -subj "/CN=${HOST}" \
  -addext "subjectAltName=${SAN}"

chmod 600 "$KEY_PATH"
chmod 644 "$CRT_PATH"

echo "Generated:"
echo "  - $CRT_PATH"
echo "  - $KEY_PATH"
