# ECS Fargate 부트스트랩 가이드

이 문서는 현재 저장소에 설정된 ECS 변수 이름과 정확히 맞는 리소스를 AWS Console에서 만드는 방법을 설명합니다.

목표:
- ECR `community-frontend` 리포지토리 생성
- ECS Task Definition 4개 생성
- ECS Service 4개 생성
- 이후 GitHub Actions `CI/CD To ECS`가 기존 리소스를 업데이트할 수 있게 만들기

현재 이미 만들어진 값:
- staging cluster: `community-staging-cluster`
- production cluster: `community-prod-cluster`

현재 네트워크:
- VPC: `vpc-03b24c84216090769`
- Subnet A: `subnet-06810494197f746d5`
- Subnet B: `subnet-0d3c10cc0c4046bee`
- Frontend SG: `sg-0cea204182ef0ccf5` (`frontend-sg`)
- Backend SG: `sg-0108d35f00aed55d8` (`backend-sg`)

현재 ECS Role:
- execution role: `arn:aws:iam::217139788460:role/community-ecs-task-execution-role`
- task role: `arn:aws:iam::217139788460:role/community-ecs-task-role`

## 1. ECR repository 만들기

해야 하는 이유:
- 현재 backend ECR은 있지만 frontend ECR은 없습니다
- ECS workflow는 ECR에 frontend/backend 이미지를 푸시한 뒤 service를 업데이트합니다

순서:
1. AWS Console 로그인
2. 상단 검색창에 `ECR` 입력
3. `Elastic Container Registry` 진입
4. 왼쪽 `Repositories`
5. `Create repository`
6. 이름 입력: `community-frontend`
7. 나머지는 기본값 유지
8. `Create repository`

정상 상태:
- repository 목록에 `community-frontend`
- repository 목록에 `community-backend`

## 2. Task Definition 만들기

중요:
- task definition은 총 4개를 만듭니다
- staging/prod는 지금 설정상 이름만 다르고 구조는 거의 같습니다

만들어야 하는 family 이름:
- `community-staging-frontend-task`
- `community-staging-backend-task`
- `community-prod-frontend-task`
- `community-prod-backend-task`

### 2-1. Frontend task definition 만들기

1. AWS Console -> `ECS`
2. 왼쪽 `Task definitions`
3. `Create new task definition`
4. 만약 생성 방식 선택이 나오면 `JSON` 또는 `Create with JSON`
5. 아래 파일 내용을 복사해서 붙여넣기

staging:
- [community-staging-frontend-task.json](/Users/sungjin/dev/personal/2-sungjin-community-fe/ecs/taskdefs/community-staging-frontend-task.json)

production:
- [community-prod-frontend-task.json](/Users/sungjin/dev/personal/2-sungjin-community-fe/ecs/taskdefs/community-prod-frontend-task.json)

6. 붙여넣기 후 `Create`

주의:
- `image` 값은 bootstrap용 DockerHub 이미지입니다
- 만약 `latest` 태그가 DockerHub에 없으면 DockerHub에서 실제 존재하는 태그로 바꿔서 만드세요

### 2-2. Backend task definition 만들기

1. AWS Console -> `ECS`
2. 왼쪽 `Task definitions`
3. `Create new task definition`
4. `JSON` 또는 `Create with JSON`
5. 아래 파일 내용을 복사해서 붙여넣기

staging:
- [community-staging-backend-task.json](/Users/sungjin/dev/personal/2-sungjin-community-fe/ecs/taskdefs/community-staging-backend-task.json)

production:
- [community-prod-backend-task.json](/Users/sungjin/dev/personal/2-sungjin-community-fe/ecs/taskdefs/community-prod-backend-task.json)

6. 붙여넣기 후 `Create`

주의:
- backend bootstrap은 `sqlite:///./community.db`로 뜨게 해뒀습니다
- 이건 ECS service를 먼저 만들기 위한 임시값입니다
- 나중에 실제 DB가 있으면 task definition 환경변수를 실제 DB URL로 바꾸면 됩니다

## 3. Service 만들기

이제 cluster 안에 service를 만들어야 GitHub Actions가 업데이트할 수 있습니다.

만들어야 하는 service 이름:
- staging
  - `community-staging-frontend-service`
  - `community-staging-backend-service`
- production
  - `community-prod-frontend-service`
  - `community-prod-backend-service`

### 3-1. production backend service

1. AWS Console -> `ECS`
2. 왼쪽 `Clusters`
3. `community-prod-cluster` 클릭
4. `Services` 탭
5. `Create`

입력:
- Compute options / launch type: `Fargate`
- Application type: `Service`
- Family: `community-prod-backend-task`
- Revision: 최신 선택
- Service name: `community-prod-backend-service`
- Desired tasks: `1`

Networking:
- VPC: `vpc-03b24c84216090769`
- Subnets:
  - `subnet-06810494197f746d5`
  - `subnet-0d3c10cc0c4046bee`
- Security group: `backend-sg` (`sg-0108d35f00aed55d8`)
- Public IP: `Turn on` 또는 `Enabled`

Load balancing:
- `Use load balancing` 끔

Service discovery:
- 끔

Auto scaling:
- 끔

마지막:
- `Create`

### 3-2. production frontend service

같은 흐름으로 만듭니다.

입력:
- Cluster: `community-prod-cluster`
- Family: `community-prod-frontend-task`
- Service name: `community-prod-frontend-service`
- Desired tasks: `1`
- VPC: `vpc-03b24c84216090769`
- Subnets:
  - `subnet-06810494197f746d5`
  - `subnet-0d3c10cc0c4046bee`
- Security group: `frontend-sg` (`sg-0cea204182ef0ccf5`)
- Public IP: `Enabled`
- Load balancing: 끔
- Service discovery: 끔

### 3-3. staging backend service

같은 방식으로:
- Cluster: `community-staging-cluster`
- Family: `community-staging-backend-task`
- Service name: `community-staging-backend-service`
- Security group: `backend-sg`

### 3-4. staging frontend service

같은 방식으로:
- Cluster: `community-staging-cluster`
- Family: `community-staging-frontend-task`
- Service name: `community-staging-frontend-service`
- Security group: `frontend-sg`

## 4. service 생성 후 확인할 것

각 cluster에서 확인:
1. `Services` 탭에 frontend/backend service가 둘 다 있는지
2. `Tasks`가 1개 이상 떠 있는지
3. `Events` 탭에 image pull error가 없는지

자주 나오는 문제:
- `CannotPullContainerError`
  - DockerHub 이미지 태그가 실제로 없는 경우
  - task definition의 `image` 값을 실제 존재하는 태그로 수정해야 함
- `ResourceInitializationError`
  - network/security group 문제일 수 있음
- task가 바로 종료됨
  - 컨테이너 환경변수 또는 포트 설정 확인

## 5. 현재 구조에서 꼭 알아야 할 점

현재 frontend ECS task는 bootstrap 용도로 아래 값을 사용합니다.
- `API_URL=http://3.35.3.239:8080`

즉:
- frontend ECS는 현재 backend ECS가 아니라 기존 `BE-EC2` 주소를 바라보게 해두었습니다
- 목적은 `ECS pipeline부터 먼저 green` 만드는 것입니다
- 나중에 backend를 ALB 또는 service discovery로 붙이면 `API_URL`을 바꾸는 게 맞습니다

## 6. ECS 생성이 끝난 뒤 실행 순서

1. values 동기화 및 확인

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/import-github-actions-env-file.sh
./scripts/apply-github-actions-config.sh
./scripts/check-github-actions-config.sh
```

2. ECS만 먼저 수동 실행

GitHub UI:
- Actions -> `CI/CD To ECS` -> `Run workflow`

또는 CLI:

```bash
gh workflow run "CI/CD To ECS" -R 80-hours-a-week/2-sungjin-community-fe --ref develop
```

3. 실행 상태 확인

```bash
gh run list -R 80-hours-a-week/2-sungjin-community-fe --limit 20
gh run view <run_id> -R 80-hours-a-week/2-sungjin-community-fe --log
```

## 7. 아직 남는 것

ECS와 별개로 K8s 쪽 값은 아직 남아 있습니다.

- `KUBE_CONFIG_DATA_STAGING`
- `KUBE_CONFIG_DATA_PROD`
- `K8S_DATABASE_URL_STAGING`
- `K8S_DATABASE_URL_PROD`
- `K8S_CORS_ALLOW_ORIGINS_STAGING`
- `K8S_CORS_ALLOW_ORIGINS_PROD`

즉:
- ECS 검증은 지금 진행 가능
- 전체 push 자동화는 K8s 값까지 있어야 완전 green입니다
