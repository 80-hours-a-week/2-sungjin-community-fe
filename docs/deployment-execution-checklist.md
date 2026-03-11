# 배포 실행 체크리스트

기준일: 2026-03-11

## 1. 현재 완료 상태

- 완료:
  - FE `Dockerfile`, `.dockerignore` 작성 및 DockerHub push 자동화
  - BE `Dockerfile`, `.dockerignore`, `Dockerfile.lambda` 작성
  - `mysql + nginx + fe + be` compose 배포 자동화
  - Portainer + private registry stack 자산 작성
  - Portainer HTTPS reverse proxy + registry basic auth 자산 작성
  - staging EC2 배포 성공
  - production EC2 배포 성공
  - production ECS 배포 성공
  - staging K8s 배포 성공
  - FE blue/green staging/prod 배포 성공
  - dedicated self-hosted runner EC2 Terraform bootstrap 자산 작성
  - FE 테스트 통과
- 아직 남음:
  - production K8s 값 입력 및 배포
  - self-hosted runner 실제 런타임 생성 및 등록
  - BE 저장소의 Lambda/BE blue-green 별도 마무리

## 2. 현재 운영 인프라 기준

- 현재는 비용 통제를 위해 AWS runtime resource를 teardown한 상태입니다.
- 검증 당시 수행 범위:
  - staging EC2 compose / blue-green
  - production EC2 compose / blue-green
  - production ECS
  - staging K8s

## 3. Codex가 끝낸 것

- `develop` 기준 staging 배포 성공
  - `CI/CD To EC2 Compose`
  - `Deploy Frontend Blue Green To EC2`
- `main` 기준 production 배포 성공
  - `CI/CD To EC2 Compose`
  - `Deploy Frontend Blue Green To EC2`
  - `CI/CD To ECS`
- 내부 health 확인 완료
  - staging FE host `/health`
  - staging FE host `/api/health`
  - production FE host `/health`
  - production FE host `/api/health`
  - production BE host `:8080/api/health`

## 4. 현재 사용자 액션 기준

현재 상태:
- 비용 통제를 위해 AWS runtime resource는 정리 완료
- 리포지토리에는 Docker / Compose / ECS / K8s / self-hosted runner 자산과 문서가 남아 있음
- push 시 AWS 리소스가 다시 생성되지 않도록 주요 배포 workflow는 `workflow_dispatch` 수동 실행 기준으로 유지

### 4-1. 포트폴리오 제출용으로 남겨둘 것

- [x] FE/BE Docker image build 자산
- [x] `mysql + nginx + fe + be` compose 자산
- [x] Portainer HTTPS + private registry 자산
- [x] GitHub Actions EC2 / ECS / K8s workflow 자산
- [x] dedicated self-hosted runner EC2 bootstrap 자산
- [x] README / runbook / reliability report

### 4-2. 필요 시에만 다시 할 일

- [ ] `K8S_DATABASE_URL_PROD` 입력
- [ ] `K8S_CORS_ALLOW_ORIGINS_PROD` 입력
- [ ] 필요 시 `enable_self_hosted_runner=true`로 runner EC2 생성
- [ ] 필요 시 Portainer/registry stack 실행 후 인증서/htpasswd 생성

참고:
- staging K8s는 `sqlite:///./data/community.db`로 검증 완료
- staging backend replica는 재배포 시에도 `1`이 되도록 workflow 기본값을 수정함

### 4-3. shared cluster 운영 방식 결정

- [ ] shared EKS에서 staging/prod를 함께 운영할지 결정
- [ ] 함께 운영하면 ingress를 host 기반으로 분리할지 결정
- [ ] production K8s용 host 또는 domain 준비

참고:
- 현재 ingress 템플릿은 hostless라서 staging/prod를 같은 클러스터에 동시에 올리면 충돌 여지가 있습니다.

### 4-4. K8s 배포 준비

- [x] `KUBE_CONFIG_DATA_STAGING` 입력
- [x] `KUBE_CONFIG_DATA_PROD` 입력
- [x] `K8S_DATABASE_URL_STAGING` 입력
- [ ] `K8S_DATABASE_URL_PROD` 입력
- [x] `K8S_CORS_ALLOW_ORIGINS_STAGING` 입력
- [ ] `K8S_CORS_ALLOW_ORIGINS_PROD` 입력

점검 명령:

```bash
./scripts/check-github-actions-config.sh
```

### 4-5. self-hosted runner가 정말 필요한지 결정

- [ ] 필요 없으면 현 상태 유지
- [ ] 필요하면 전용 EC2를 생성하고 GitHub self-hosted runner 등록

현재 조치:
- [deploy-ec2-compose-self-hosted.yml](/Users/sungjin/dev/personal/2-sungjin-community-fe/.github/workflows/deploy-ec2-compose-self-hosted.yml)는 `workflow_dispatch` 수동 실행 전용으로 바꿨습니다.
- Terraform 자산:
  - `enable_self_hosted_runner`
  - `runner_instance_type`
  - `github_runner_org`
  - `github_runner_repo`
  - `github_runner_version`
  - `github_runner_token`

### 4-6. BE 저장소 별도 작업

- [ ] Lambda 배포용 BE 저장소 secrets 입력
- [ ] BE blue/green용 별도 인프라/시크릿 입력
- [ ] 필요하면 BE 저장소 워크플로우 수동 실행

BE 저장소 참고:
- [deploy-lambda-image.yml](/Users/sungjin/dev/personal/2-sungjin-community-be/.github/workflows/deploy-lambda-image.yml)
- [deploy-be-blue-green.yml](/Users/sungjin/dev/personal/2-sungjin-community-be/.github/workflows/deploy-be-blue-green.yml)

## 5. 남은 필수 설정값

현재 누락:

- repo vars
  - `K8S_DATABASE_URL_PROD`
  - `K8S_CORS_ALLOW_ORIGINS_PROD`

참고 문서:
- [github-actions-secrets-vars-template.md](/Users/sungjin/dev/personal/2-sungjin-community-fe/docs/github-actions-secrets-vars-template.md)

## 6. 완료 판정 기준

이번 범위를 완료로 볼 수 있는 기준:

- staging EC2 배포 성공
- production EC2 배포 성공
- production ECS 배포 성공
- staging K8s 배포 성공
- Portainer HTTPS + authenticated private registry 자산 준비 완료
- dedicated self-hosted runner EC2 provisioning 자산 준비 완료
- FE/BE health 정상
- 커밋/푸시 및 README 문서화 완료

운영 상시 구동은 비용 문제로 완료 판정에 포함하지 않습니다.
