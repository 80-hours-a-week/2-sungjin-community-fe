# AWS Big-Bang Deployment (Frontend + Backend)

이 디렉토리는 커뮤니티 프로젝트를 **빅뱅 배포**하기 위한 Terraform 템플릿입니다.

## 포함된 AWS 서비스
- VPC
- IAM
- Security Group
- Elastic IP
- EC2 (프론트/백엔드 분리)
- EFS
- CloudTrail
- CloudWatch
- RDS (PostgreSQL)
- S3
- API Gateway (HTTP API)
- Lambda (파일 업로드 pre-signed URL)
- ELB (ALB: 프론트/백엔드)

## 아키텍처 요약
- `Frontend EC2` (public subnet)
- `Backend EC2` (private subnet)
- `Frontend ALB` (public)
- `Backend ALB` (public)
- `RDS`, `EFS` (private subnet)
- `S3` 업로드 버킷 + `Lambda` + `API Gateway` (파일 업로드 전용)
- `CloudTrail` 로그 버킷 저장 + `CloudWatch` 로그/알람

## 사전 준비
1. AWS 자격증명 설정 (`aws configure`)
2. Terraform 설치 (>= 1.5)
3. EC2 Key Pair 생성

## 배포 방법
```bash
cd infra/aws-bigbang
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars 값 수정 (특히 key_pair_name, db_password)

terraform init
terraform plan
terraform apply
```

## 배포 후 출력값
- `frontend_alb_url`: 웹 접속 URL
- `backend_api_url`: API URL
- `upload_api_url`: Lambda 업로드 API URL
- `frontend_eip`: 프론트 인스턴스 EIP

## 파일 업로드 경로
프론트는 `FILE_UPLOAD_API_URL`이 설정되면 아래 순서로 업로드합니다.
1. `POST {FILE_UPLOAD_API_URL}/upload-url` (Lambda)
2. 응답 `upload_url`로 `PUT` 업로드(S3)
3. `image_url`을 게시글/프로필에 저장

## 주의사항
- 이 템플릿은 과제 제출용 기준의 참조 구현입니다.
- 운영 환경에서는 HTTPS(ACM), Route53, WAF, 비밀정보(Secrets Manager), ALB 리스너 443 설정을 추가하세요.
