# 배포 실행 체크리스트

기준일: 2026-03-09

## 1. 현재 상태 요약

- 완료:
  - FE `Dockerfile`, `.dockerignore` 작성됨
  - BE `Dockerfile`, `.dockerignore`, `Dockerfile.lambda` 작성됨
  - FE/BE 동시 실행용 Compose 작성됨
  - `nginx + mysql + fe + be` 과제형 Compose 작성됨
  - EC2 Compose, ECS, K8s, FE Blue/Green GitHub Actions 작성됨
  - FE 테스트 통과 (`7/7`)
  - Compose 파일 문법 검증 통과
- 미완료:
  - 새 워크플로우/문서가 아직 로컬 변경분 상태
  - GitHub Secrets/Variables 미입력
  - BE 테스트 로컬 실패 (`readonly database`)
  - Lambda/BE Blue-Green/ECS는 BE 저장소 기준 별도 설정 필요

## 2. Codex가 확인한 것

- FE 테스트: `npm test -- --runInBand` 통과
- Compose 파싱:
  - `docker-compose.yml`
  - `docker-compose.deploy.yml`
  - `docker-compose.reverse-proxy.deploy.yml`
- GitHub 원격 설정 현황:
  - Repo secrets 있음: `DOCKERHUB_USER`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_PRIVATE_KEY`
  - Repo variables 없음
  - `staging` environment secrets 없음
  - `production` environment secrets 없음

## 3. 사용자 체크리스트

### 3-1. 코드 반영

- [ ] FE 저장소 로컬 변경분을 commit/push 한다.
- [ ] `develop` 브랜치에 새 워크플로우가 올라간 것을 GitHub에서 확인한다.

관련 파일:
- [ci-cd-ec2-compose.yml](/Users/sungjin/dev/personal/2-sungjin-community-fe/.github/workflows/ci-cd-ec2-compose.yml)
- [ci-cd-ecs.yml](/Users/sungjin/dev/personal/2-sungjin-community-fe/.github/workflows/ci-cd-ecs.yml)
- [deploy-k8s-fe-be.yml](/Users/sungjin/dev/personal/2-sungjin-community-fe/.github/workflows/deploy-k8s-fe-be.yml)
- [deploy-fe-blue-green.yml](/Users/sungjin/dev/personal/2-sungjin-community-fe/.github/workflows/deploy-fe-blue-green.yml)

### 3-2. GitHub Actions 설정값 입력

- [ ] Repo secret `DOCKERHUB_PAT` 입력
- [ ] Repo secrets `STAGING_AWS_*`, `PROD_AWS_*` 입력
- [ ] Repo variables `STAGING_*`, `PROD_*`, `K8S_*`, `BACKEND_*` 입력
- [ ] `staging` environment secrets 입력
- [ ] `production` environment secrets 입력

참고 문서:
- [github-actions-secrets-vars-template.md](/Users/sungjin/dev/personal/2-sungjin-community-fe/docs/github-actions-secrets-vars-template.md)

자동 점검:

```bash
./scripts/check-github-actions-config.sh
```

### 3-3. 인프라 준비

- [ ] EC2 staging/prod 인스턴스 접속 정보 확보
- [ ] ECS staging/prod 클러스터, 서비스, task family 이름 확보
- [ ] K8s staging/prod kubeconfig 확보
- [ ] Blue/Green용 FE 대상 EC2 정보 확보
- [ ] Lambda용 AWS 권한과 함수 정보 준비

### 3-4. 테스트/검증

- [ ] BE 테스트 환경 수정 후 백엔드 테스트를 다시 통과시킨다.
- [ ] 필요 시 로컬에서 reverse proxy compose를 실제로 띄워서 smoke test 한다.
- [ ] `develop` push 후 staging 워크플로우 성공 확인
- [ ] `main` push 후 production 워크플로우 성공 확인

권장 실행:

```bash
docker compose -f docker-compose.reverse-proxy.deploy.yml up -d
curl -i http://127.0.0.1:8080/api/health
curl -i http://127.0.0.1:8080/
docker compose -f docker-compose.reverse-proxy.deploy.yml down
```

### 3-5. BE 저장소 별도 작업

- [ ] Lambda 배포용 BE 저장소 secrets 입력
- [ ] ECS Fargate 배포용 BE 저장소 secrets/vars 입력
- [ ] BE Blue/Green 대상 인프라와 시크릿 입력

BE 저장소 참고:
- [deploy-lambda-image.yml](/Users/sungjin/dev/personal/2-sungjin-community-be/.github/workflows/deploy-lambda-image.yml)
- [deploy-ecs-fargate.yml](/Users/sungjin/dev/personal/2-sungjin-community-be/.github/workflows/deploy-ecs-fargate.yml)
- [deploy-be-blue-green.yml](/Users/sungjin/dev/personal/2-sungjin-community-be/.github/workflows/deploy-be-blue-green.yml)

## 4. 우선순위

1. FE 저장소 변경분 push
2. GitHub Secrets/Variables 입력
3. staging 자동배포 확인
4. production 자동배포 확인
5. BE 저장소 Lambda/ECS/Blue-Green 마무리

## 5. 완료 판정 기준

아래가 모두 만족되면 이번 범위는 완료로 봐도 된다.

- `develop` push 시 staging EC2/ECS/K8s 배포 성공
- `main` push 시 production EC2/ECS/K8s 배포 성공
- DockerHub에 FE/BE 이미지 태그 푸시 확인
- 단일 EC2 compose에서 `mysql + nginx + fe + be` 기동 확인
- FE/BE health check 정상
- Lambda 이미지 배포 성공
