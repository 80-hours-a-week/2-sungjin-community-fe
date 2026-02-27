#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <github-org> <github-repo> <runner-version> <runner-token>"
  echo "Example: $0 80-hours-a-week 2-sungjin-community-fe 2.326.0 AAAAA..."
  exit 1
fi

GITHUB_ORG="$1"
GITHUB_REPO="$2"
RUNNER_VERSION="$3"
RUNNER_TOKEN="$4"

RUNNER_DIR="$HOME/actions-runner"
RUNNER_URL="https://github.com/${GITHUB_ORG}/${GITHUB_REPO}"

sudo useradd -m -s /bin/bash actions || true
sudo mkdir -p "$RUNNER_DIR"
sudo chown -R "$(id -u):$(id -g)" "$RUNNER_DIR"

cd "$RUNNER_DIR"
if [[ ! -f "./config.sh" ]]; then
  curl -fsSL -o actions-runner-linux-x64.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf actions-runner-linux-x64.tar.gz
fi

./config.sh \
  --url "$RUNNER_URL" \
  --token "$RUNNER_TOKEN" \
  --labels "linux,x64,ec2" \
  --unattended \
  --replace

sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status
