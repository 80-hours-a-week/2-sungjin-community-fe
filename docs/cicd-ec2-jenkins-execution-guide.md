# CI/CD Execution Guide (Terraform + Self-Hosted Runner + Jenkins)

## 1) Remove/Rebuild AWS Infra with Terraform

### Local execution
```bash
cd /Users/sungjin/dev/personal/2-sungjin-community-fe
export CONFIRM_DESTROY_PROD=DESTROY_PROD
./scripts/infra-rebuild.sh rebuild
```

- `destroy` mode: `./scripts/infra-rebuild.sh destroy`
- `rebuild` mode: `destroy -> apply` 연속 실행

### GitHub Actions execution
- Workflow: `Rebuild AWS BigBang Infra`
- Inputs:
  - `mode`: `destroy` 또는 `rebuild`
  - `confirm`: `DESTROY_PROD`
- Required secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `TERRAFORM_TFVARS` (기존 `terraform.tfvars` 파일 전체 내용)

## 2) Put Tests into CI/CD

### Frontend
- Workflow: `.github/workflows/ci-frontend.yml`
- 실행 항목: `npm ci` + `npm test`

### Backend
- Workflow: `.github/workflows/ci-backend.yml`
- 실행 항목: `compileall` + `import smoke` + `pytest`
- 테스트 로그 파일 경로는 `/tmp`로 지정해 권한 이슈를 피함

## 3) Run GitHub Actions on Your Own EC2

### 3-1. Register self-hosted runner on EC2
1. GitHub Repo > `Settings` > `Actions` > `Runners` > `New self-hosted runner`
2. Runner token 복사
3. EC2에서 실행:
```bash
cd /home/ec2-user
git clone https://github.com/80-hours-a-week/2-sungjin-community-fe.git
cd 2-sungjin-community-fe
./scripts/register-self-hosted-runner.sh 80-hours-a-week 2-sungjin-community-fe 2.326.0 <RUNNER_TOKEN>
```

### 3-2. Deploy workflow on self-hosted runner
- Workflow: `Deploy Compose On Self-Hosted EC2`
- Runner labels: `self-hosted, linux, x64, ec2`
- Required secrets:
  - `DOCKERHUB_USER`
  - `DOCKERHUB_PAT`
- Input:
  - `image_tag` (예: `miniquest-20260226-1213`)

## 4) Attach Jenkins on EC2 and Connect GitHub

### 4-1. Jenkins install on EC2 (Amazon Linux 2023)
```bash
sudo dnf update -y
sudo dnf install -y java-17-amazon-corretto git docker
sudo systemctl enable --now docker

sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
sudo dnf install -y jenkins
sudo systemctl enable --now jenkins
```

### 4-2. Jenkins 초기 설정
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
- 브라우저에서 `http://<EC2_PUBLIC_IP>:8080`
- Plugin 설치:
  - `Pipeline`
  - `GitHub`
  - `Docker Pipeline`
  - `Credentials Binding`

### 4-3. GitHub Webhook 연결
1. GitHub Repo > `Settings` > `Webhooks` > `Add webhook`
2. Payload URL: `http://<JENKINS_PUBLIC_IP>:8080/github-webhook/`
3. Content type: `application/json`
4. Events: `Just the push event` + `Pull requests`

### 4-4. Jenkins credentials
- `dockerhub-creds` (Username + Personal Access Token)
- GitHub private repo면 `github-token` 추가

### 4-5. Jenkins pipeline source
- FE repo root: `Jenkinsfile`
- BE repo root: `Jenkinsfile`

