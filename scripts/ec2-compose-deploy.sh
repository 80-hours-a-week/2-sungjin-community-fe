#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 <ec2-host> <ec2-user> <dockerhub-user> <tag>"
  echo "Example: $0 13.124.45.148 ec2-user sungjin9288 v1.0.0"
  exit 1
fi

EC2_HOST="$1"
EC2_USER="$2"
DOCKERHUB_USER="$3"
TAG="$4"

ssh "${EC2_USER}@${EC2_HOST}" "mkdir -p ~/community-compose"

scp docker-compose.deploy.yml "${EC2_USER}@${EC2_HOST}:~/community-compose/docker-compose.deploy.yml"

ssh "${EC2_USER}@${EC2_HOST}" "bash -lc '
  set -euo pipefail
  cd ~/community-compose
  export DOCKERHUB_USER=${DOCKERHUB_USER}
  export TAG=${TAG}
  docker compose -f docker-compose.deploy.yml pull
  docker compose -f docker-compose.deploy.yml up -d
  docker compose -f docker-compose.deploy.yml ps
'"
