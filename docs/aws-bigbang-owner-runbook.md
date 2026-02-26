# AWS Big-Bang 배포: 작업자 실행 문서 (Owner Runbook)

작성일: 2026-02-23
대상: 프로젝트 담당자(직접 AWS 배포/검증 수행)

## 1. 목적
이 문서는 아래 과제를 직접 수행하기 위한 실무 실행 지침입니다.
- 프론트엔드/백엔드 분리 EC2 빅뱅 배포
- 필수 AWS 서비스 연동 (VPC, IAM, SG, EIP, EC2, EFS, CloudTrail, CloudWatch, RDS, S3, API Gateway, Lambda, ELB)
- 파일 업로드를 Lambda + API Gateway 경유로 강제
- 전체 기능 QA 완료

## 2. 작업 범위 (본인이 직접 해야 하는 것)
- AWS 계정/권한 준비
- Terraform 변수값 작성 및 apply 실행
- 배포 결과 확인 및 운영 파라미터 점검
- 기능 QA/증빙 수집
- 실패 시 복구(재배포/부분 수정)

## 3. 사전 준비 체크리스트
- [ ] AWS 계정 접근 가능
- [ ] 로컬에 AWS CLI 설치 및 인증 완료 (`aws configure`)
- [ ] 로컬에 Terraform 설치 (>= 1.5)
- [ ] 로컬에 Node.js 설치 (테스트 실행용)
- [ ] EC2 Key Pair 생성 완료
- [ ] 현재 공인IP 확인 (SSH 제한용)

### 3.1 권장 IAM 권한
최소 아래 리소스 생성/조회/수정/삭제 권한 필요:
- EC2, VPC, ELBv2, IAM(역할/정책/인스턴스 프로파일), RDS, EFS, S3
- CloudWatch, CloudTrail, Lambda, API Gateway v2

## 4. 배포 전 입력값 작성
작업 디렉토리:
```bash
cd infra/aws-bigbang
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars`에서 반드시 수정:
- `key_pair_name`: 본인 Key Pair 이름
- `db_password`: 강한 비밀번호
- `admin_cidr`: 본인 IP만 허용 권장 (예: `123.45.67.89/32`)

필요 시 수정:
- `aws_region`
- `frontend_repo_url`, `frontend_repo_branch`
- `backend_repo_url`, `backend_repo_branch`
- 인스턴스 타입

## 5. 배포 실행 절차 (필수 순서)

### 5.1 초기화/검증/계획
```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out tfplan
```

### 5.2 반영
```bash
terraform apply tfplan
```

### 5.3 출력값 확보
```bash
terraform output
```
필수 기록값:
- `frontend_alb_url`
- `backend_api_url`
- `upload_api_url`
- `frontend_eip`
- `rds_endpoint`
- `uploads_bucket`

## 6. 배포 직후 인프라 확인 (콘솔 점검)

### 6.1 EC2
- [ ] 프론트/백엔드 인스턴스 2대 분리 생성 확인
- [ ] `Status checks` 2/2 통과
- [ ] SSM 접속 가능(또는 SSH)

### 6.2 ELB(ALB)
- [ ] 프론트 ALB 생성/활성
- [ ] 백엔드 ALB 생성/활성
- [ ] Target Group health check 모두 healthy

### 6.3 RDS/EFS
- [ ] RDS 상태 `available`
- [ ] 백엔드에서 DB 연결 가능
- [ ] EFS mount target 2개 이상 생성 확인

### 6.4 S3/Lambda/API Gateway
- [ ] S3 업로드 버킷 생성
- [ ] Lambda 함수 생성
- [ ] API Gateway HTTP API + `POST /upload-url` 라우트 확인

### 6.5 CloudTrail/CloudWatch
- [ ] CloudTrail trail 활성화
- [ ] CloudTrail 로그가 S3/CloudWatch에 쌓이는지 확인
- [ ] CloudWatch 로그 그룹/EC2 CPU 알람 생성 확인

## 7. 기능 QA (필수)
참조: `docs/aws-bigbang-qa.md`

### 7.1 프론트/백엔드 기본 동작
- [ ] `frontend_alb_url` 접속
- [ ] 로그인/회원가입/로그아웃
- [ ] 게시글 CRUD
- [ ] 댓글 CRUD
- [ ] 좋아요/취소
- [ ] 프로필 수정/비밀번호 변경/회원탈퇴

### 7.2 API 헬스/통합 테스트
```bash
API_URL=http://<backend-alb-dns> npm run test:integration
```
성공 기준:
- 스크립트 마지막에 `All API integration checks passed.` 출력

### 7.3 업로드 경로 강제 검증 (중요)
```bash
FILE_UPLOAD_API_URL=<upload_api_url> npm run test:upload
```
성공 기준:
- `Upload succeeded.` 출력
- 출력된 `image_url`이 S3 경로

브라우저 Network 탭 검증:
- [ ] `POST <upload_api_url>/upload-url` 요청 존재
- [ ] 이후 pre-signed URL로 `PUT` 요청 존재
- [ ] 백엔드 `/images/*`로 직접 업로드하지 않음

## 8. 제출용 증빙 자료 체크리스트
아래 증빙을 캡처/저장 권장:
- [ ] Terraform apply 성공 로그
- [ ] `terraform output` 결과
- [ ] EC2 2대(프론트/백엔드) 화면
- [ ] ALB 2개 + Target Group health 화면
- [ ] RDS/EFS 생성 화면
- [ ] S3 버킷/객체 화면
- [ ] Lambda/API Gateway 라우트 화면
- [ ] CloudTrail 이벤트 및 CloudWatch 로그/알람 화면
- [ ] `npm run test:integration` 성공 로그
- [ ] `npm run test:upload` 성공 로그
- [ ] 브라우저 Network 탭(업로드 2단계 호출) 캡처

## 9. 장애 대응 가이드

### 9.1 프론트 접속 불가
1. Frontend ALB Target health 확인
2. 프론트 EC2 접속 후 서비스 확인
```bash
sudo systemctl status community-frontend
sudo journalctl -u community-frontend -n 200 --no-pager
```
3. `.env`의 `API_URL`, `FILE_UPLOAD_API_URL` 확인

### 9.2 API 5xx/타임아웃
1. Backend ALB Target health 확인
2. 백엔드 EC2에서 서비스/로그 확인
```bash
sudo systemctl status community-backend
sudo journalctl -u community-backend -n 200 --no-pager
```
3. RDS endpoint/SG(5432) 확인

### 9.3 업로드 실패
1. `upload_api_url` 값 정확성 확인
2. Lambda 로그(CloudWatch) 확인
3. S3 CORS/버킷 정책 확인
4. 프론트 `.env`에 `FILE_UPLOAD_API_URL` 설정 여부 확인

## 10. 롤백/정리

### 10.1 코드 롤백
- repo branch를 이전 커밋으로 고정 후 재배포

### 10.2 인프라 정리
```bash
terraform destroy
```
주의:
- destroy 전 S3/RDS 백업 필요 여부 확인

## 11. 최종 완료 기준 (Definition of Done)
- [ ] 인프라 생성 완료 + 필수 서비스 모두 존재
- [ ] 프론트/백엔드 분리 배포 확인
- [ ] 업로드가 Lambda+API Gateway 경유임을 증빙
- [ ] 핵심 기능 QA 통과
- [ ] 테스트 스크립트 2종 성공 로그 확보
- [ ] 제출용 증빙 패키지 정리 완료
