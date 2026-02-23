# AWS Big-Bang QA Checklist

## A. 인프라 검증
- [ ] VPC, Public/Private Subnet 생성 확인
- [ ] Internet Gateway/NAT Gateway/EIP 연결 확인
- [ ] Frontend EC2, Backend EC2가 서로 다른 인스턴스로 생성됨
- [ ] Frontend ALB / Backend ALB 상태 `active`
- [ ] RDS 상태 `available`
- [ ] EFS mount target 생성 확인
- [ ] CloudTrail trail 생성 및 로그 적재 확인
- [ ] CloudWatch 로그 그룹/EC2 CPU 알람 생성 확인
- [ ] S3 업로드 버킷 생성 확인
- [ ] API Gateway + Lambda 연결 확인 (`POST /upload-url`)

## B. 기능 QA (필수)

### 1) 프론트엔드
- [ ] `frontend_alb_url` 접속 가능
- [ ] 로그인 페이지 렌더링
- [ ] 회원가입/로그인/로그아웃 동작

### 2) 백엔드 API
- [ ] `backend_api_url/health` 200 OK
- [ ] 게시글 목록 조회
- [ ] 게시글 CRUD
- [ ] 댓글 CRUD
- [ ] 좋아요/취소
- [ ] 프로필 수정/비밀번호 변경/회원탈퇴

### 3) 파일 업로드 (Lambda + API Gateway 강제)
- [ ] 브라우저 개발자 도구에서 `POST {FILE_UPLOAD_API_URL}/upload-url` 호출 확인
- [ ] 이후 `PUT https://{bucket}.s3...` 요청 확인
- [ ] 업로드 이미지 URL이 게시글/프로필에 반영되는지 확인

## C. 자동 QA 스크립트
### 1) API 통합
```bash
API_URL=http://<backend-alb-dns> npm run test:integration
```

### 2) 업로드 API 단건 확인 (curl)
```bash
curl -X POST "<upload_api_url>/upload-url" \
  -H "Content-Type: application/json" \
  -d '{"file_name":"sample.png","file_type":"image/png","upload_type":"post"}'
```
- 응답의 `data.upload_url`에 대해 `PUT` 업로드가 성공해야 함

## D. 장애/롤백 체크
- [ ] ALB target health 확인
- [ ] EC2 systemd 서비스 상태 확인
  - `sudo systemctl status community-frontend`
  - `sudo systemctl status community-backend`
- [ ] 롤백 시점: `terraform destroy` 또는 이전 AMI/코드로 재배포
