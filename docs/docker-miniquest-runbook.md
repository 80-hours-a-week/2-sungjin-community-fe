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
```

상태 확인:

```bash
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

로컬 이미지 푸시:

```bash
./scripts/docker-push.sh <dockerhub-username> <tag>
# 예: ./scripts/docker-push.sh sungjin9288 v1.0.0
```

## 5. EC2에 compose로 배포
사전 준비:
- EC2에 Docker + Compose 설치
- SSH 접속 가능

배포:

```bash
./scripts/ec2-compose-deploy.sh <ec2-host> <ec2-user> <dockerhub-username> <tag>
# 예: ./scripts/ec2-compose-deploy.sh 13.124.45.148 ec2-user sungjin9288 v1.0.0
```

참고:
- EC2 배포는 `docker-compose.deploy.yml`(image 기반) 파일을 사용합니다.
- 로컬 개발/검증은 `docker-compose.yml`(build 기반)을 사용합니다.

## 6. BE 이미지 -> Lambda 배포
중요: Lambda 컨테이너 이미지는 Docker Hub가 아니라 ECR 이미지만 지원.

기본 흐름:
1. ECR repository 생성
2. BE 이미지를 ECR로 push
3. Lambda를 "Container image" 타입으로 생성/업데이트
4. API Gateway 트리거 연결

## 7. Docker Reverse Proxy 미니퀘스트
권장 구성:
- Nginx 컨테이너 추가
- `/` -> frontend:3001
- `/api` -> backend:8000

검증:
- `http://<host>/` FE 렌더링
- `http://<host>/api/health` 200

## 8. EC2 / ECS Fargate / Lambda CI-CD
권장 최소 파이프라인:
1. GitHub Actions on push
2. FE/BE 이미지 build + test
3. ECR push
4. 대상별 배포 자동화
   - EC2: SSH + compose pull/up
   - ECS Fargate: task definition 업데이트 + service deploy
   - Lambda: update-function-code (image-uri)

## 정리 명령

```bash
docker compose down
```

볼륨까지 정리:

```bash
docker compose down -v
```
