# Docker 미니퀘스트 실행 가이드

작성일: 2026-02-27

## 목표
- FE/BE를 Docker 이미지로 빌드
- `frontend + backend + nginx(reverse proxy) + mysql`를 Docker Compose로 동시 실행
- 통합 테스트 수행
- Docker Hub 푸시
- Portainer + Private Registry 운영
- Portainer HTTPS 적용 확인

## 0. 사전 준비
- FE 저장소: `/Users/sungjin/dev/personal/2-sungjin-community-fe`
- BE 저장소: `/Users/sungjin/dev/personal/2-sungjin-community-be`
- Docker Desktop 또는 Docker Engine + Compose Plugin

확인:

```bash
docker --version
docker compose version
```

## 1. FE/BE 이미지 빌드

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
docker compose -f docker-compose.reverse-proxy.yml build
```

이미지 확인:

```bash
docker images | grep -E "community-(frontend|backend)"
```

## 2. Reverse Proxy + MySQL 포함 전체 스택 실행

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
docker compose -f docker-compose.reverse-proxy.yml up -d
docker compose -f docker-compose.reverse-proxy.yml ps
```

구성:
- `community-mysql` (MySQL 8.4)
- `community-backend` (FastAPI + Alembic)
- `community-frontend` (Express)
- `community-reverse-proxy` (Nginx, `:8080`)

## 3. 기능/헬스체크 검증

```bash
curl -i http://127.0.0.1:8080/api/health
curl -i http://127.0.0.1:8080/
```

통합 테스트:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
API_URL=http://127.0.0.1:8080/api npm run test:integration
```

업로드 테스트(API Gateway 경로 유지 시):

```bash
FILE_UPLOAD_API_URL=https://<api-id>.execute-api.ap-northeast-2.amazonaws.com npm run test:upload
```

## 4. Docker Hub 푸시

로그인:

```bash
docker login -u <dockerhub-username>
```

멀티 아키텍처 푸시:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/docker-push.sh <dockerhub-username> <tag>
```

예시:

```bash
./scripts/docker-push.sh sungjin9288 miniquest-20260227-1
```

## 5. EC2 Compose 배포 (선택)

기본(기존 2컨테이너) 배포:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/ec2-compose-deploy.sh <ec2-host> <ec2-user> <dockerhub-user> <tag> [ssh-key-path]
```

예시:

```bash
./scripts/ec2-compose-deploy.sh 13.124.45.148 ec2-user sungjin9288 miniquest-20260227-1 ~/community-prod-key.pem
```

과제형(nginx + mysql 포함) 배포:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
COMPOSE_FILE=docker-compose.reverse-proxy.deploy.yml \
./scripts/ec2-compose-deploy.sh <ec2-host> <ec2-user> <dockerhub-user> <tag> [ssh-key-path]
```

## 6. Portainer + Private Registry 실행

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
docker compose -f docker-compose.portainer-registry.yml up -d
docker compose -f docker-compose.portainer-registry.yml ps
```

포트:
- Portainer HTTPS: `9443`
- Private Registry: `5000`

## 7. Portainer HTTPS 검증

브라우저:
- `https://<서버IP>:9443`
- 첫 접속 시 self-signed 인증서 경고가 보이면 예외 허용 후 진입

CLI 확인:

```bash
curl -kI https://127.0.0.1:9443
```

## 8. Portainer에서 Registry 연결 및 이미지 관리

1. Portainer 로그인 후 `Settings` -> `Registries`
2. `Add registry`
3. Name: `community-private-registry`
4. URL: `http://registry:5000` (Portainer와 같은 Docker 네트워크 기준)
5. 저장 후 연결 확인

로컬에서 프라이빗 레지스트리 푸시 예시:

```bash
docker tag sungjin9288/community-frontend:miniquest-20260227-1 localhost:5000/community-frontend:miniquest-20260227-1
docker push localhost:5000/community-frontend:miniquest-20260227-1
```

```bash
docker tag sungjin9288/community-backend:miniquest-20260227-1 localhost:5000/community-backend:miniquest-20260227-1
docker push localhost:5000/community-backend:miniquest-20260227-1
```

참고:
- Docker Engine이 `http://localhost:5000` 푸시를 차단하면 Docker 데몬에 `insecure-registries` 설정이 필요할 수 있습니다.
- EC2에서는 `/etc/docker/daemon.json`에 `"insecure-registries": ["<registry-host>:5000"]` 추가 후 Docker 재시작으로 해결합니다.

## 9. 정리

애플리케이션 스택 종료:

```bash
docker compose -f docker-compose.reverse-proxy.yml down
```

Portainer/Registry 스택 종료:

```bash
docker compose -f docker-compose.portainer-registry.yml down
```

볼륨까지 제거:

```bash
docker compose -f docker-compose.reverse-proxy.yml down -v
docker compose -f docker-compose.portainer-registry.yml down -v
```
