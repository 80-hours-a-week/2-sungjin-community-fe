# GitHub Actions Secrets/Variables Template

대상 저장소: `80-hours-a-week/2-sungjin-community-fe`

사용 방법:
1. 아래 템플릿의 `<...>` 값을 채운다.
2. GitHub UI(`Settings -> Secrets and variables -> Actions`)에 입력한다.
3. Environment(`staging`, `production`)는 Environment Secrets에 입력한다.

---

## 0) 값 채우기 전에 (준비)

필수 준비:
- DockerHub 계정 (PAT 발급 가능)
- AWS 계정 (ECS/ECR/K8s/EC2 접근 가능)
- (선택) Backend private repo를 Actions에서 checkout해야 하면 GitHub token 필요

GitHub 입력 위치:
- Repo Secret: `Settings -> Secrets and variables -> Actions -> Secrets -> Repository secrets`
- Repo Variable: `Settings -> Secrets and variables -> Actions -> Variables`
- Environment Secret:
  - `Settings -> Environments -> staging -> Environment secrets`
  - `Settings -> Environments -> production -> Environment secrets`

브랜치 매핑:
- `develop` -> `staging`
- `main` -> `production`

---

## 0-a) 완전 초보자용: 값은 "찾는 것"과 "만드는 것"이 있다

먼저 이것만 구분하면 덜 헷갈립니다.

- `찾는 값`
  - 이미 AWS/GitHub/DockerHub/EC2/K8s에 존재하는 이름이나 주소
  - 예시: `STAGING_EC2_HOST`, `STAGING_ECS_CLUSTER_NAME`, `K8S_API_URL_STAGING`
- `새로 만드는 값`
  - 직접 발급하거나 생성해야 하는 자격증명
  - 예시: `DOCKERHUB_PAT`, `STAGING_AWS_ACCESS_KEY_ID`, `STAGING_AWS_SECRET_ACCESS_KEY`

아래는 많이 헷갈리는 값들부터 순서대로 설명합니다.

### A. `STAGING_AWS_ACCESS_KEY_ID`, `STAGING_AWS_SECRET_ACCESS_KEY`

이 2개는 "기존 화면 어딘가에 항상 보이는 값"이 아니라, 보통 **IAM 사용자용 Access Key를 새로 발급**해서 얻습니다.

어디서:
- AWS Console 로그인
- 상단 검색창에 `IAM` 검색
- `IAM` 서비스 진입
- 왼쪽 메뉴 `Users`

어떻게:
1. staging용 사용자가 이미 있으면 그 사용자를 클릭
2. 없으면 `Create user`로 새 사용자 생성
3. 사용자 화면에서 `Security credentials` 탭 클릭
4. `Access keys` 섹션에서 `Create access key`
5. AWS가 사용 목적을 묻는 화면이 나오면 `CLI` 또는 `Third-party service` 성격에 맞는 항목 선택
6. 생성 완료 화면에서 아래 2개가 나옵니다
   - `Access key ID` -> `STAGING_AWS_ACCESS_KEY_ID`
   - `Secret access key` -> `STAGING_AWS_SECRET_ACCESS_KEY`

넣는 값:
- `STAGING_AWS_ACCESS_KEY_ID`: `AKIA...` 형태 문자열
- `STAGING_AWS_SECRET_ACCESS_KEY`: 긴 비밀 문자열

주의:
- `Secret access key`는 생성 직후 한 번만 보이는 경우가 많습니다
- 놓치면 다시 조회가 아니라 **새 키를 다시 생성**해야 합니다
- production도 같은 방식으로 별도 생성:
  - `PROD_AWS_ACCESS_KEY_ID`
  - `PROD_AWS_SECRET_ACCESS_KEY`

권장:
- staging/prod를 같은 IAM 유저로 쓰지 말고 분리
- 예시 이름:
  - `community-staging-cicd`
  - `community-prod-cicd`

### B. `DOCKERHUB_PAT`

이 값도 "조회"보다 **새로 발급**하는 개념입니다.

어디서:
- DockerHub 로그인
- 우측 상단 프로필
- `Account Settings`
- `Personal access tokens`

어떻게:
1. `Generate new token`
2. 이름 입력
3. 권한은 `Read & Write`
4. 생성 직후 표시되는 토큰 문자열 복사

넣는 값:
- 생성 직후 보이는 토큰 원문 전체

주의:
- 목록 화면에서는 토큰 이름만 보이고 원문은 다시 못 봅니다
- 잃어버리면 새로 발급해야 합니다

### C. `STAGING_EC2_HOST`, `PROD_EC2_HOST`

이 값은 새로 만드는 것이 아니라 **EC2 인스턴스의 주소를 찾아서 복사**하는 값입니다.

어디서:
- AWS Console
- `EC2`
- 왼쪽 메뉴 `Instances`
- 대상 인스턴스 클릭

어떻게:
1. 인스턴스를 클릭
2. 상세 화면에서 아래 둘 중 하나를 복사
   - `Public IPv4 address`
   - `Public IPv4 DNS`

넣는 값 예시:
- `13.124.45.148`
- `ec2-13-124-45-148.ap-northeast-2.compute.amazonaws.com`

### D. `STAGING_EC2_USER`, `PROD_EC2_USER`

이 값은 EC2 운영체제에 따라 다릅니다.

보통:
- Amazon Linux: `ec2-user`
- Ubuntu: `ubuntu`

어디서 확인:
- EC2 인스턴스 생성할 때 사용한 AMI 이름
- 또는 실제 SSH 접속할 때 쓰는 사용자 이름

이미 아래처럼 접속해봤다면:

```bash
ssh -i <pem파일> ec2-user@13.124.45.148
```

그때의 `ec2-user`가 넣을 값입니다.

### E. `STAGING_EC2_SSH_PRIVATE_KEY`, `PROD_EC2_SSH_PRIVATE_KEY`

이 값은 `.pem` 파일의 "파일 경로"가 아니라 **파일 내용 전체**입니다.

어디서:
- EC2 인스턴스 생성할 때 다운로드한 키 파일
- 예시: `/Users/sungjin/community-prod-key.pem`

넣는 값:
- 아래처럼 파일 안의 텍스트 전체

```text
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

CLI로 넣을 때는 파일 자체를 그대로 복사하면 됩니다.

### F. `KUBE_CONFIG_DATA_STAGING`, `KUBE_CONFIG_DATA_PROD`

이 값은 Kubernetes 클러스터 접속 정보 파일입니다.

어디서:
- 로컬에서 이미 `kubectl`로 접속 중이면 보통 `~/.kube/config`
- EKS라면 AWS CLI로 다시 생성 가능

어떻게:
- 기존 kubeconfig 파일이 있으면 그 파일 내용을 그대로 사용
- 또는 EKS라면 아래 명령으로 갱신 가능

```bash
aws eks update-kubeconfig --region ap-northeast-2 --name <cluster_name>
```

넣는 값:
- `~/.kube/config` 파일의 내용 전체

### G. `STAGING_ECR_FRONTEND_REPOSITORY`, `STAGING_ECR_BACKEND_REPOSITORY`

이 값은 ECR의 "리포지토리 이름"입니다.

어디서:
- AWS Console
- `ECR`
- `Repositories`

넣는 값 예시:
- `community-frontend`
- `community-backend`

주의:
- 전체 URI가 아니라 이름만 넣습니다
- 예를 들어 `123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/community-frontend` 전체를 넣지 않습니다
- 넣는 값은 마지막 이름 부분만입니다

### H. `STAGING_ECS_CLUSTER_NAME`, `STAGING_ECS_FRONTEND_SERVICE`, `STAGING_ECS_BACKEND_SERVICE`

이 값들은 ECS 화면에 이미 있는 이름을 복사합니다.

어디서:
- AWS Console
- `ECS`
- `Clusters`

어떻게:
1. 클러스터 목록에서 대상 클러스터 이름 복사
2. 클러스터 안으로 들어가서 `Services` 탭 이동
3. frontend 서비스 이름 복사
4. backend 서비스 이름 복사

### I. `STAGING_ECS_FRONTEND_TASK_FAMILY`, `STAGING_ECS_BACKEND_TASK_FAMILY`

이 값은 ECS Task Definition 이름입니다.

어디서:
- AWS Console
- `ECS`
- 왼쪽 메뉴 `Task definitions`

넣는 값 예시:
- `community-frontend-task`
- `community-backend-task`

### J. `K8S_API_URL_*`, `K8S_FILE_UPLOAD_API_URL_*`

이 값은 프론트가 호출할 API 주소입니다.

예시:
- `K8S_API_URL_STAGING`: `/api` 또는 `https://staging-api.example.com`
- `K8S_FILE_UPLOAD_API_URL_STAGING`: `https://xxxxx.execute-api.ap-northeast-2.amazonaws.com`

어디서:
- API Gateway 주소면 AWS `API Gateway`
- 도메인을 붙였으면 Route53 또는 배포 문서
- 프론트에서 상대경로 프록시를 쓸 거면 `/api`

### K. `K8S_DATABASE_URL_*`

이 값은 DB 연결 문자열입니다.

예시:
- PostgreSQL:
  - `postgresql+psycopg://user:password@host:5432/dbname`
- MySQL:
  - `mysql+pymysql://user:password@host:3306/dbname`

어디서:
- DB 계정/비밀번호/호스트/포트/DB명 정보를 조합해서 직접 만듭니다
- 호스트는 RDS 상세 화면의 `Endpoint`에서 확인 가능

---

## 1) Repo Secrets (Actions secrets)

```bash
DOCKERHUB_USER=<dockerhub_username>
DOCKERHUB_PAT=<dockerhub_personal_access_token>
BACKEND_REPO_TOKEN=<optional_backend_repo_access_token>

STAGING_AWS_ACCESS_KEY_ID=<staging_aws_access_key_id>
STAGING_AWS_SECRET_ACCESS_KEY=<staging_aws_secret_access_key>
PROD_AWS_ACCESS_KEY_ID=<prod_aws_access_key_id>
PROD_AWS_SECRET_ACCESS_KEY=<prod_aws_secret_access_key>
```

값 생성 가이드:
- `DOCKERHUB_USER`
  - 어디서: DockerHub 로그인 계정명
  - 넣는 값: 사용자 이름 문자열
- `DOCKERHUB_PAT`
  - 어디서: DockerHub -> `Account Settings -> Personal access tokens`
  - 만들기: `Read/Write` 권한 토큰 발급
  - 넣는 값: 발급된 토큰 원문
- `BACKEND_REPO_TOKEN` (선택)
  - 어디서: GitHub PAT (backend repo 읽기 권한)
  - 필요 시점: backend repo가 private이고 checkout 실패할 때
- `STAGING_AWS_ACCESS_KEY_ID` / `STAGING_AWS_SECRET_ACCESS_KEY`
- `PROD_AWS_ACCESS_KEY_ID` / `PROD_AWS_SECRET_ACCESS_KEY`
  - 어디서: AWS IAM User Access Key
  - 권장: staging/prod IAM 유저 분리 + 최소권한
  - 최소 필요 범위(개요): ECR push, ECS deploy, task definition 조회/등록, `iam:PassRole`

## 2) Environment Secrets - staging

Environment: `staging`

```bash
STAGING_EC2_HOST=<staging_ec2_public_ip_or_dns>
STAGING_EC2_USER=<staging_ec2_user>
STAGING_EC2_SSH_PRIVATE_KEY=<staging_ec2_ssh_private_key_pem_contents>

KUBE_CONFIG_DATA_STAGING=<staging_kubeconfig_yaml_or_base64>

STAGING_FE_BLUEGREEN_EC2_HOST=<staging_bluegreen_ec2_public_ip_or_dns>
STAGING_FE_BLUEGREEN_EC2_USER=<staging_bluegreen_ec2_user>
STAGING_FE_BLUEGREEN_EC2_SSH_PRIVATE_KEY=<staging_bluegreen_ec2_ssh_private_key_pem_contents>
STAGING_FE_BLUEGREEN_API_URL=<staging_backend_api_url>
STAGING_FE_BLUEGREEN_FILE_UPLOAD_API_URL=<staging_file_upload_api_url>
```

값 생성 가이드:
- `STAGING_EC2_HOST`
  - 어디서: AWS EC2 Console -> Instance -> Public IPv4 / Public DNS
  - 넣는 값 예시: `13.124.xx.xx` 또는 `ec2-...amazonaws.com`
- `STAGING_EC2_USER`
  - 어디서: 인스턴스 AMI 기준
  - 보통: Amazon Linux=`ec2-user`, Ubuntu=`ubuntu`
- `STAGING_EC2_SSH_PRIVATE_KEY`
  - 어디서: 인스턴스 생성 시 사용한 `.pem`
  - 넣는 값: 파일 내용 전체 (BEGIN/END 포함)
- `KUBE_CONFIG_DATA_STAGING`
  - 어디서: staging 클러스터 kubeconfig
  - 넣는 값: kubeconfig 원문 YAML 또는 base64 (워크플로우 둘 다 지원)
- `STAGING_FE_BLUEGREEN_*`
  - 어디서: blue/green 대상 EC2 정보 + 백엔드 API URL + 업로드 API URL

## 3) Environment Secrets - production

Environment: `production`

```bash
PROD_EC2_HOST=<prod_ec2_public_ip_or_dns>
PROD_EC2_USER=<prod_ec2_user>
PROD_EC2_SSH_PRIVATE_KEY=<prod_ec2_ssh_private_key_pem_contents>

KUBE_CONFIG_DATA_PROD=<prod_kubeconfig_yaml_or_base64>

PROD_FE_BLUEGREEN_EC2_HOST=<prod_bluegreen_ec2_public_ip_or_dns>
PROD_FE_BLUEGREEN_EC2_USER=<prod_bluegreen_ec2_user>
PROD_FE_BLUEGREEN_EC2_SSH_PRIVATE_KEY=<prod_bluegreen_ec2_ssh_private_key_pem_contents>
PROD_FE_BLUEGREEN_API_URL=<prod_backend_api_url>
PROD_FE_BLUEGREEN_FILE_UPLOAD_API_URL=<prod_file_upload_api_url>
```

값 생성 가이드:
- staging과 동일한 방식으로 production 리소스 값을 넣으면 됨
- 운영 보호를 위해 production Environment에 `Required reviewers` 설정 권장

## 4) Repo Variables (Actions variables)

```bash
BACKEND_REPO=80-hours-a-week/2-sungjin-community-be
BACKEND_REF=main

STAGING_AWS_REGION=<staging_aws_region>
PROD_AWS_REGION=<prod_aws_region>

STAGING_ECR_FRONTEND_REPOSITORY=<staging_ecr_frontend_repository_name>
STAGING_ECR_BACKEND_REPOSITORY=<staging_ecr_backend_repository_name>
STAGING_ECS_CLUSTER_NAME=<staging_ecs_cluster_name>
STAGING_ECS_FRONTEND_SERVICE=<staging_ecs_frontend_service_name>
STAGING_ECS_BACKEND_SERVICE=<staging_ecs_backend_service_name>
STAGING_ECS_FRONTEND_TASK_FAMILY=<staging_ecs_frontend_task_family>
STAGING_ECS_BACKEND_TASK_FAMILY=<staging_ecs_backend_task_family>
STAGING_ECS_FRONTEND_CONTAINER_NAME=<optional_staging_frontend_container_name>
STAGING_ECS_BACKEND_CONTAINER_NAME=<optional_staging_backend_container_name>

PROD_ECR_FRONTEND_REPOSITORY=<prod_ecr_frontend_repository_name>
PROD_ECR_BACKEND_REPOSITORY=<prod_ecr_backend_repository_name>
PROD_ECS_CLUSTER_NAME=<prod_ecs_cluster_name>
PROD_ECS_FRONTEND_SERVICE=<prod_ecs_frontend_service_name>
PROD_ECS_BACKEND_SERVICE=<prod_ecs_backend_service_name>
PROD_ECS_FRONTEND_TASK_FAMILY=<prod_ecs_frontend_task_family>
PROD_ECS_BACKEND_TASK_FAMILY=<prod_ecs_backend_task_family>
PROD_ECS_FRONTEND_CONTAINER_NAME=<optional_prod_frontend_container_name>
PROD_ECS_BACKEND_CONTAINER_NAME=<optional_prod_backend_container_name>

K8S_API_URL_STAGING=<staging_k8s_api_url_or_/api>
K8S_API_URL_PROD=<prod_k8s_api_url_or_/api>
K8S_FILE_UPLOAD_API_URL_STAGING=<staging_k8s_file_upload_api_url>
K8S_FILE_UPLOAD_API_URL_PROD=<prod_k8s_file_upload_api_url>
K8S_DATABASE_URL_STAGING=<staging_k8s_database_url>
K8S_DATABASE_URL_PROD=<prod_k8s_database_url>
K8S_CORS_ALLOW_ORIGINS_STAGING=<staging_k8s_cors_allow_origins_csv>
K8S_CORS_ALLOW_ORIGINS_PROD=<prod_k8s_cors_allow_origins_csv>
K8S_INGRESS_CLASS_NAME_STAGING=<staging_k8s_ingress_class_name>
K8S_INGRESS_CLASS_NAME_PROD=<prod_k8s_ingress_class_name>

STAGING_COMPOSE_FILE=<optional_staging_compose_file_path>
PROD_COMPOSE_FILE=<optional_prod_compose_file_path>
STAGING_API_URL=<optional_staging_api_url_for_compose>
PROD_API_URL=<optional_prod_api_url_for_compose>
STAGING_FILE_UPLOAD_API_URL=<optional_staging_file_upload_api_url_for_compose>
PROD_FILE_UPLOAD_API_URL=<optional_prod_file_upload_api_url_for_compose>
```

값 생성 가이드:
- `BACKEND_REPO`, `BACKEND_REF`
  - 어디서: backend GitHub 저장소/브랜치
  - 예시: `80-hours-a-week/2-sungjin-community-be`, `main`
- `STAGING_AWS_REGION`, `PROD_AWS_REGION`
  - 어디서: AWS 리전
  - 예시: `ap-northeast-2`
- `*_ECR_*_REPOSITORY`
  - 어디서: AWS ECR Repository 이름
  - 주의: 전체 URI가 아니라 리포지토리 이름만
  - 예시: `community-frontend`, `community-backend`
- `*_ECS_CLUSTER_NAME`, `*_ECS_*_SERVICE`, `*_ECS_*_TASK_FAMILY`
  - 어디서: AWS ECS 콘솔
  - service/task family 이름 정확히 일치 필요
- `K8S_API_URL_*`
  - 어디서: 프론트 컨테이너가 호출할 API 기준
  - 예시: Ingress rewrite 사용 시 `/api`
- `K8S_FILE_UPLOAD_API_URL_*`
  - 어디서: API Gateway 업로드 URL
  - 예시: `https://{api-id}.execute-api.{region}.amazonaws.com`
- `K8S_DATABASE_URL_*`
  - 어디서: DB 연결 문자열
  - 예시(PostgreSQL): `postgresql+psycopg://user:pass@host:5432/dbname`
- `K8S_CORS_ALLOW_ORIGINS_*`
  - 어디서: 허용할 프론트 도메인 목록
  - 형식: 쉼표 구분 CSV
- `K8S_INGRESS_CLASS_NAME_*`
  - 어디서: `kubectl get ingressclass`
  - 예시: `nginx`
- `STAGING_COMPOSE_FILE`, `PROD_COMPOSE_FILE`
  - 어디서: 리포 경로
  - 예시: `docker-compose.deploy.yml` 또는 `docker-compose.reverse-proxy.deploy.yml`
- `STAGING_API_URL`, `PROD_API_URL`
- `STAGING_FILE_UPLOAD_API_URL`, `PROD_FILE_UPLOAD_API_URL`
  - 어디서: compose 배포 시 프론트에 주입할 값

---

## 5) Optional CLI input example (`gh`)

```bash
REPO=80-hours-a-week/2-sungjin-community-fe

# Repo secret
gh secret set DOCKERHUB_PAT -R "$REPO" --body "<value>"

# Environment secret (staging)
gh secret set STAGING_EC2_HOST -R "$REPO" --env staging --body "<value>"

# Environment secret (production)
gh secret set PROD_EC2_HOST -R "$REPO" --env production --body "<value>"

# Repo variable
gh variable set STAGING_ECS_CLUSTER_NAME -R "$REPO" --body "<value>"
```

---

## 6) 자동 점검 스크립트

값을 입력한 뒤 아래 스크립트로 누락 여부를 한 번에 확인할 수 있습니다.

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/check-github-actions-config.sh
```

---

## 7) 빠른 조회 명령 (AWS CLI)

아래 명령은 값 찾을 때 유용함:

```bash
# ECR repo 목록
aws ecr describe-repositories --query 'repositories[].repositoryName' --output text

# ECS 클러스터 목록
aws ecs list-clusters --output text

# 특정 클러스터의 서비스 목록
aws ecs list-services --cluster <cluster_name>

# ECS 서비스의 task definition ARN 확인
aws ecs describe-services --cluster <cluster_name> --services <service_name> --query 'services[0].taskDefinition' --output text

# IngressClass 확인
kubectl get ingressclass

# EC2 Public IP/DNS 확인
aws ec2 describe-instances --filters Name=instance-state-name,Values=running \
  --query 'Reservations[].Instances[].[InstanceId,PublicIpAddress,PublicDnsName,Tags]' --output table
```
