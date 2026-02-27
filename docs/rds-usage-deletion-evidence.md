# RDS Usage & Deletion Evidence

기준 시각: 2026-02-27 14:17:46 KST

## 1) RDS 생성/운영 증빙

아래는 실제 운영 중이던 RDS 인스턴스 조회 결과입니다.

```text
Class      : db.t4g.micro
Created    : 2026-02-27T03:01:32.465000+00:00
Endpoint   : community-prod-postgres.cdocsyeqskrs.ap-northeast-2.rds.amazonaws.com
Engine     : postgres
Identifier : community-prod-postgres
MultiAZ    : False
Status     : available
StorageGB  : 20
```

## 2) RDS 사용 기능 검증 증빙

RDS 연결이 필요한 백엔드 통합 기능 테스트를 실제로 통과했습니다.

```text
API integration: All API integration checks passed.
Upload test    : Upload succeeded.
```

실행 커맨드:

```bash
API_URL=http://community-prod-alb-api-600472452.ap-northeast-2.elb.amazonaws.com npm run test:integration
FILE_UPLOAD_API_URL=https://u33b22v0y6.execute-api.ap-northeast-2.amazonaws.com npm run test:upload
```

## 3) 비용 최적화 조치

과금 절감을 위해 운영 검증 이후 RDS 인스턴스를 삭제했습니다.

- 삭제 대상: `community-prod-postgres`
- Region: `ap-northeast-2`
- 삭제 방식: final snapshot 미생성(`--skip-final-snapshot`)

삭제 커맨드:

```bash
aws rds delete-db-instance \
  --region ap-northeast-2 \
  --db-instance-identifier community-prod-postgres \
  --skip-final-snapshot \
  --delete-automated-backups
```

후속 확인 커맨드:

```bash
aws rds describe-db-instances --region ap-northeast-2
```

삭제 완료 확인 결과:

```text
An error occurred (DBInstanceNotFound) when calling the DescribeDBInstances operation:
DBInstance community-prod-postgres not found.
```
