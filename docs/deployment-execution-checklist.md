# 배포 실행 체크리스트

기준일: 2026-03-10

## 1. 현재 완료 상태

- 완료:
  - FE `Dockerfile`, `.dockerignore` 작성 및 DockerHub push 자동화
  - BE `Dockerfile`, `.dockerignore`, `Dockerfile.lambda` 작성
  - `mysql + nginx + fe + be` compose 배포 자동화
  - staging EC2 배포 성공
  - production EC2 배포 성공
  - production ECS 배포 성공
  - FE blue/green staging/prod 배포 성공
  - FE 테스트 통과
- 아직 남음:
  - K8s secrets/vars 미입력
  - K8s 배포 미실행
  - self-hosted runner 미구성
  - 기존 구형 EC2 정리
  - BE 저장소의 Lambda/BE blue-green 별도 마무리

## 2. 현재 운영 인프라 기준

- staging:
  - FE blue/green EC2: `43.203.254.53`
  - BE compose EC2: `13.125.251.52`
- production:
  - FE blue/green EC2: `3.34.42.44`
  - BE compose EC2: `15.164.170.95`
- production ECS:
  - cluster: `community-prod-cluster`
  - frontend service: `community-prod-frontend-service`
  - backend service: `community-prod-backend-service`

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

## 4. 지금 사용자님이 해야 하는 일

### 4-1. 브라우저로 최종 확인

- [ ] staging 접속 확인: `http://43.203.254.53`
- [ ] production 접속 확인: `http://3.34.42.44`
- [ ] 로그인, 게시글 목록, 게시글 상세, 업로드까지 한 번씩 수동 확인

### 4-2. 구형 EC2 정리

- [ ] old staging BE 인스턴스 `i-035a919987aa159d8` 중지 또는 종료
- [ ] old production FE 인스턴스 `i-0c3f4c6eecd8d61bd` 중지 또는 종료
- [ ] old production BE 인스턴스 `i-0984b493881d8275b` 중지 또는 종료

권장:
- 먼저 `중지`
- 하루 정도 문제 없으면 `종료`

### 4-3. 임시 보안그룹 규칙 정리

- [ ] `SSH 22 / 0.0.0.0/0` 임시 허용 삭제
- [ ] `BE 8080 / 0.0.0.0/0` 임시 허용 삭제

참고:
- production FE는 private backend IP를 향하도록 설정했기 때문에 prod의 `8080 공개`는 유지할 이유가 없습니다.

### 4-4. K8s 배포 준비

- [ ] `KUBE_CONFIG_DATA_STAGING` 입력
- [ ] `KUBE_CONFIG_DATA_PROD` 입력
- [ ] `K8S_DATABASE_URL_STAGING` 입력
- [ ] `K8S_DATABASE_URL_PROD` 입력
- [ ] `K8S_CORS_ALLOW_ORIGINS_STAGING` 입력
- [ ] `K8S_CORS_ALLOW_ORIGINS_PROD` 입력

점검 명령:

```bash
./scripts/check-github-actions-config.sh
```

### 4-5. self-hosted runner가 정말 필요한지 결정

- [ ] 필요 없으면 현 상태 유지
- [ ] 필요하면 GitHub self-hosted runner를 별도 설치

현재 조치:
- [deploy-ec2-compose-self-hosted.yml](/Users/sungjin/dev/personal/2-sungjin-community-fe/.github/workflows/deploy-ec2-compose-self-hosted.yml)는 `workflow_dispatch` 수동 실행 전용으로 바꿨습니다.

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
  - `K8S_DATABASE_URL_STAGING`
  - `K8S_DATABASE_URL_PROD`
  - `K8S_CORS_ALLOW_ORIGINS_STAGING`
  - `K8S_CORS_ALLOW_ORIGINS_PROD`
- environment secrets
  - `KUBE_CONFIG_DATA_STAGING`
  - `KUBE_CONFIG_DATA_PROD`

참고 문서:
- [github-actions-secrets-vars-template.md](/Users/sungjin/dev/personal/2-sungjin-community-fe/docs/github-actions-secrets-vars-template.md)

## 6. 완료 판정 기준

이번 범위를 완료로 볼 수 있는 기준:

- staging EC2 배포 성공
- production EC2 배포 성공
- production ECS 배포 성공
- FE/BE health 정상
- 브라우저 수동 점검 완료
- 구형 EC2 및 임시 보안그룹 정리 완료
- K8s 값 입력 후 K8s 배포 성공
