# GitHub Actions CLI 실행 가이드

이 문서는 GitHub UI 대신 `gh` CLI로 Secrets/Variables를 일괄 등록하는 절차를 정리합니다.

## 0. 가장 쉬운 방법: 한 파일만 수정하기

아래 파일 하나만 수정하면 됩니다.

- [values.env](/Users/sungjin/dev/personal/2-sungjin-community-fe/ops/github-actions-input/values.env)

실행 순서:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/import-github-actions-env-file.sh
./scripts/apply-github-actions-config.sh
./scripts/check-github-actions-config.sh
```

`values.env`를 수정하면 스크립트가 자동으로 아래 폴더에 분배합니다.

- `ops/github-actions-input/repo-secrets`
- `ops/github-actions-input/repo-vars`
- `ops/github-actions-input/env-staging-secrets`
- `ops/github-actions-input/env-production-secrets`

---

## 1. 입력 폴더 만들기

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/init-github-actions-input.sh
```

생성되는 경로:

- `ops/github-actions-input/repo-secrets`
- `ops/github-actions-input/repo-vars`
- `ops/github-actions-input/env-staging-secrets`
- `ops/github-actions-input/env-production-secrets`

이 경로는 `.gitignore`에 추가되어 있어 커밋되지 않습니다.

## 2. 파일로 값 채우기

### 2-1. Repository secrets

예시:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe

printf '%s' 'sungjin9288' > ops/github-actions-input/repo-secrets/DOCKERHUB_USER
printf '%s' '<dockerhub_pat>' > ops/github-actions-input/repo-secrets/DOCKERHUB_PAT
printf '%s' '<staging_aws_access_key_id>' > ops/github-actions-input/repo-secrets/STAGING_AWS_ACCESS_KEY_ID
printf '%s' '<staging_aws_secret_access_key>' > ops/github-actions-input/repo-secrets/STAGING_AWS_SECRET_ACCESS_KEY
printf '%s' '<prod_aws_access_key_id>' > ops/github-actions-input/repo-secrets/PROD_AWS_ACCESS_KEY_ID
printf '%s' '<prod_aws_secret_access_key>' > ops/github-actions-input/repo-secrets/PROD_AWS_SECRET_ACCESS_KEY
```

선택:

```bash
printf '%s' '<github_pat_for_backend_repo>' > ops/github-actions-input/repo-secrets/BACKEND_REPO_TOKEN
```

### 2-2. Repository variables

예시:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe

printf '%s' '80-hours-a-week/2-sungjin-community-be' > ops/github-actions-input/repo-vars/BACKEND_REPO
printf '%s' 'main' > ops/github-actions-input/repo-vars/BACKEND_REF
printf '%s' 'ap-northeast-2' > ops/github-actions-input/repo-vars/STAGING_AWS_REGION
printf '%s' 'ap-northeast-2' > ops/github-actions-input/repo-vars/PROD_AWS_REGION
printf '%s' 'community-frontend' > ops/github-actions-input/repo-vars/STAGING_ECR_FRONTEND_REPOSITORY
printf '%s' 'community-backend' > ops/github-actions-input/repo-vars/STAGING_ECR_BACKEND_REPOSITORY
printf '%s' '<staging_cluster>' > ops/github-actions-input/repo-vars/STAGING_ECS_CLUSTER_NAME
printf '%s' '<staging_frontend_service>' > ops/github-actions-input/repo-vars/STAGING_ECS_FRONTEND_SERVICE
printf '%s' '<staging_backend_service>' > ops/github-actions-input/repo-vars/STAGING_ECS_BACKEND_SERVICE
printf '%s' '<staging_frontend_task_family>' > ops/github-actions-input/repo-vars/STAGING_ECS_FRONTEND_TASK_FAMILY
printf '%s' '<staging_backend_task_family>' > ops/github-actions-input/repo-vars/STAGING_ECS_BACKEND_TASK_FAMILY
printf '%s' 'community-frontend' > ops/github-actions-input/repo-vars/PROD_ECR_FRONTEND_REPOSITORY
printf '%s' 'community-backend' > ops/github-actions-input/repo-vars/PROD_ECR_BACKEND_REPOSITORY
printf '%s' '<prod_cluster>' > ops/github-actions-input/repo-vars/PROD_ECS_CLUSTER_NAME
printf '%s' '<prod_frontend_service>' > ops/github-actions-input/repo-vars/PROD_ECS_FRONTEND_SERVICE
printf '%s' '<prod_backend_service>' > ops/github-actions-input/repo-vars/PROD_ECS_BACKEND_SERVICE
printf '%s' '<prod_frontend_task_family>' > ops/github-actions-input/repo-vars/PROD_ECS_FRONTEND_TASK_FAMILY
printf '%s' '<prod_backend_task_family>' > ops/github-actions-input/repo-vars/PROD_ECS_BACKEND_TASK_FAMILY
printf '%s' '/api' > ops/github-actions-input/repo-vars/K8S_API_URL_STAGING
printf '%s' '/api' > ops/github-actions-input/repo-vars/K8S_API_URL_PROD
printf '%s' '<staging_upload_api_url>' > ops/github-actions-input/repo-vars/K8S_FILE_UPLOAD_API_URL_STAGING
printf '%s' '<prod_upload_api_url>' > ops/github-actions-input/repo-vars/K8S_FILE_UPLOAD_API_URL_PROD
printf '%s' '<staging_database_url>' > ops/github-actions-input/repo-vars/K8S_DATABASE_URL_STAGING
printf '%s' '<prod_database_url>' > ops/github-actions-input/repo-vars/K8S_DATABASE_URL_PROD
printf '%s' 'https://staging.example.com' > ops/github-actions-input/repo-vars/K8S_CORS_ALLOW_ORIGINS_STAGING
printf '%s' 'https://example.com' > ops/github-actions-input/repo-vars/K8S_CORS_ALLOW_ORIGINS_PROD
printf '%s' 'nginx' > ops/github-actions-input/repo-vars/K8S_INGRESS_CLASS_NAME_STAGING
printf '%s' 'nginx' > ops/github-actions-input/repo-vars/K8S_INGRESS_CLASS_NAME_PROD
```

과제형 compose를 쓸 경우:

```bash
printf '%s' 'docker-compose.reverse-proxy.deploy.yml' > ops/github-actions-input/repo-vars/STAGING_COMPOSE_FILE
printf '%s' 'docker-compose.reverse-proxy.deploy.yml' > ops/github-actions-input/repo-vars/PROD_COMPOSE_FILE
```

### 2-3. Staging environment secrets

단일 문자열:

```bash
printf '%s' '<staging_ec2_ip_or_dns>' > ops/github-actions-input/env-staging-secrets/STAGING_EC2_HOST
printf '%s' 'ec2-user' > ops/github-actions-input/env-staging-secrets/STAGING_EC2_USER
printf '%s' '<staging_bluegreen_ec2_ip_or_dns>' > ops/github-actions-input/env-staging-secrets/STAGING_FE_BLUEGREEN_EC2_HOST
printf '%s' 'ec2-user' > ops/github-actions-input/env-staging-secrets/STAGING_FE_BLUEGREEN_EC2_USER
printf '%s' '<staging_api_url>' > ops/github-actions-input/env-staging-secrets/STAGING_FE_BLUEGREEN_API_URL
printf '%s' '<staging_upload_api_url>' > ops/github-actions-input/env-staging-secrets/STAGING_FE_BLUEGREEN_FILE_UPLOAD_API_URL
```

멀티라인 파일 복사:

```bash
cp /path/to/staging-key.pem ops/github-actions-input/env-staging-secrets/STAGING_EC2_SSH_PRIVATE_KEY
cp /path/to/staging-key.pem ops/github-actions-input/env-staging-secrets/STAGING_FE_BLUEGREEN_EC2_SSH_PRIVATE_KEY
cp /path/to/staging-kubeconfig.yaml ops/github-actions-input/env-staging-secrets/KUBE_CONFIG_DATA_STAGING
```

### 2-4. Production environment secrets

단일 문자열:

```bash
printf '%s' '<prod_ec2_ip_or_dns>' > ops/github-actions-input/env-production-secrets/PROD_EC2_HOST
printf '%s' 'ec2-user' > ops/github-actions-input/env-production-secrets/PROD_EC2_USER
printf '%s' '<prod_bluegreen_ec2_ip_or_dns>' > ops/github-actions-input/env-production-secrets/PROD_FE_BLUEGREEN_EC2_HOST
printf '%s' 'ec2-user' > ops/github-actions-input/env-production-secrets/PROD_FE_BLUEGREEN_EC2_USER
printf '%s' '<prod_api_url>' > ops/github-actions-input/env-production-secrets/PROD_FE_BLUEGREEN_API_URL
printf '%s' '<prod_upload_api_url>' > ops/github-actions-input/env-production-secrets/PROD_FE_BLUEGREEN_FILE_UPLOAD_API_URL
```

멀티라인 파일 복사:

```bash
cp /Users/sungjin/community-prod-key.pem ops/github-actions-input/env-production-secrets/PROD_EC2_SSH_PRIVATE_KEY
cp /Users/sungjin/community-prod-key.pem ops/github-actions-input/env-production-secrets/PROD_FE_BLUEGREEN_EC2_SSH_PRIVATE_KEY
cp /path/to/prod-kubeconfig.yaml ops/github-actions-input/env-production-secrets/KUBE_CONFIG_DATA_PROD
```

## 3. GitHub에 일괄 반영

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
gh auth status
./scripts/apply-github-actions-config.sh
```

## 4. 누락 점검

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
./scripts/check-github-actions-config.sh
```

모든 required 항목이 `OK`면 완료입니다.

## 5. 코드 반영 및 배포 트리거

현재 브랜치가 `develop`이면 staging 배포가 자동으로 트리거됩니다.

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe

git add \
  .gitignore \
  .github/workflows/ci-cd-ec2-compose.yml \
  .github/workflows/ci-cd-ecs.yml \
  .github/workflows/deploy-ec2-compose-self-hosted.yml \
  .github/workflows/deploy-fe-blue-green.yml \
  .github/workflows/deploy-k8s-fe-be.yml \
  docker-compose.deploy.yml \
  docs/community-infra-reliability-report.md \
  docs/deployment-execution-checklist.md \
  docs/github-actions-cli-runbook.md \
  docs/github-actions-secrets-vars-template.md \
  k8s/templates/00-namespace.yaml.tpl \
  k8s/templates/10-backend.yaml.tpl \
  k8s/templates/20-frontend.yaml.tpl \
  k8s/templates/30-ingress.yaml.tpl \
  scripts/apply-github-actions-config.sh \
  scripts/check-github-actions-config.sh \
  scripts/ec2-compose-deploy.sh \
  scripts/init-github-actions-input.sh

git commit -m "Add automated deployment workflows and config helpers"
git push origin develop
```

production 반영:

```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
git checkout main
git merge --no-ff develop
git push origin main
```

## 6. 배포 확인 명령

워크플로우 확인:

```bash
gh run list -R 80-hours-a-week/2-sungjin-community-fe --limit 20
```

특정 실행 상세:

```bash
gh run view <run_id> -R 80-hours-a-week/2-sungjin-community-fe --log
```
