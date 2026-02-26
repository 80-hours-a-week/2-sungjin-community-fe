# Docker 미니퀘스트 실행 가이드

작성일: 2026-02-25

## 목표
- FE/BE 이미지 빌드
- docker compose 동시 실행
- 로컬 통합 테스트
- Docker Hub 푸시
- EC2 compose 배포
- BE 컨테이너 이미지를 Lambda(ECR 기반)로 배포
- Reverse proxy 미니퀘스트
- EC2/ECS/Lambda CI/CD 파이프라인 기초 구성

## 1. FE, BE 이미지 만들기
프로젝트 루트에서:

```bash
docker compose build
```

생성 이미지 확인:

```bash
docker images | grep -E "community-(frontend|backend)"
```

## 2. docker compose로 2개 이미지 동시 실행

```bash
docker compose up -d
docker compose ps
```

## 3. test
헬스체크:

```bash
curl -i http://127.0.0.1:8000/health
curl -i http://127.0.0.1:3001/login
```

통합 테스트:

```bash
API_URL=http://127.0.0.1:8000 npm run test:integration
```

## 4. Docker Hub에 이미지 푸시
Docker Hub 로그인:

```bash
docker login
```

멀티 아키텍처(기본) 푸시:

```bash
./scripts/docker-push.sh <dockerhub-username> <tag>
# 예: ./scripts/docker-push.sh sungjin9288 v1.0.0
```

특정 아키텍처만 푸시:

```bash
./scripts/docker-push.sh <dockerhub-username> <tag> linux/arm64
```

## 5. EC2에 compose로 배포

```bash
./scripts/ec2-compose-deploy.sh <ec2-host> <ec2-user> <dockerhub-username> <tag> [ssh-key-path]
# 예: ./scripts/ec2-compose-deploy.sh 13.124.45.148 ec2-user sungjin9288 v1.0.0 ~/community-prod-key.pem
```

참고:
- EC2 배포는 `docker-compose.deploy.yml`(image 기반) 사용
- 로컬 개발/검증은 `docker-compose.yml`(build 기반) 사용

## 6. BE 이미지 -> Lambda 배포
중요: Lambda 컨테이너 이미지는 ECR 이미지만 지원합니다.

구현 파일:
- `2-sungjin-community-be/Dockerfile.lambda`
- `2-sungjin-community-be/app/lambda_handler.py`
- `2-sungjin-community-be/scripts/deploy-lambda-image.sh`

로컬/수동 배포:

```bash
cd ../2-sungjin-community-be
./scripts/deploy-lambda-image.sh <aws-region> <aws-account-id> <ecr-repository> <lambda-function-name> [image-tag] [lambda-role-arn]
# 예: ./scripts/deploy-lambda-image.sh ap-northeast-2 123456789012 community-backend-lambda community-backend-lambda v1.0.0 arn:aws:iam::123456789012:role/lambda-exec-role
```

## 7. Docker Reverse Proxy 미니퀘스트
구현 파일:
- `docker-compose.reverse-proxy.yml`
- `ops/nginx/reverse-proxy.conf`

실행:

```bash
docker compose -f docker-compose.reverse-proxy.yml up -d --build
```

검증:

```bash
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/api/health
```

## 8. EC2 / ECS Fargate / Lambda CI-CD
구현 워크플로우:
- FE CI: `.github/workflows/ci-frontend.yml`
- FE EC2 배포: `.github/workflows/deploy-ec2-compose.yml`
- BE CI: `../2-sungjin-community-be/.github/workflows/ci-backend.yml`
- BE ECS Fargate 배포: `../2-sungjin-community-be/.github/workflows/deploy-ecs-fargate.yml`
- BE Lambda 이미지 배포: `../2-sungjin-community-be/.github/workflows/deploy-lambda-image.yml`

필수 GitHub Secrets(요약):
- 공통 AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`
- FE EC2: `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`, `DOCKERHUB_USER`
- BE ECS: `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_FAMILY`, `ECS_EXECUTION_ROLE_ARN`, `ECS_TASK_ROLE_ARN`, `ECS_LOG_GROUP`
- BE Lambda: `LAMBDA_EXEC_ROLE_ARN`

## 정리 명령

```bash
docker compose down
```

볼륨까지 정리:

```bash
docker compose down -v
```
