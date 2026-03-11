variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "community"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs (2+)"
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs (2+)"
  type        = list(string)
  default     = ["10.20.11.0/24", "10.20.12.0/24"]
}

variable "availability_zones" {
  description = "Availability zones (2+)"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "admin_cidr" {
  description = "Admin CIDR for SSH access"
  type        = string
  default     = "0.0.0.0/0"
}

variable "key_pair_name" {
  description = "Existing EC2 Key Pair name"
  type        = string
}

variable "frontend_instance_type" {
  description = "Frontend EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "backend_instance_type" {
  description = "Backend EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "enable_self_hosted_runner" {
  description = "Whether to provision a dedicated EC2 for a GitHub Actions self-hosted runner"
  type        = bool
  default     = false
}

variable "runner_instance_type" {
  description = "Dedicated self-hosted runner EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "frontend_repo_url" {
  description = "Frontend Git repository URL"
  type        = string
  default     = "https://github.com/sungjin9288/2-sungjin-community-fe.git"
}

variable "backend_repo_url" {
  description = "Backend Git repository URL"
  type        = string
  default     = "https://github.com/sungjin9288/2-sungjin-community-be.git"
}

variable "frontend_repo_branch" {
  description = "Frontend Git branch"
  type        = string
  default     = "develop"
}

variable "backend_repo_branch" {
  description = "Backend Git branch"
  type        = string
  default     = "develop"
}

variable "github_runner_org" {
  description = "GitHub organization or owner for self-hosted runner registration"
  type        = string
  default     = "80-hours-a-week"
}

variable "github_runner_repo" {
  description = "GitHub repository name for self-hosted runner registration"
  type        = string
  default     = "2-sungjin-community-fe"
}

variable "github_runner_version" {
  description = "GitHub Actions runner version"
  type        = string
  default     = "2.326.0"
}

variable "github_runner_token" {
  description = "Ephemeral GitHub self-hosted runner registration token. Leave empty to provision host without auto-registration."
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "community"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "community_admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "enable_rds" {
  description = "Whether to provision RDS PostgreSQL"
  type        = bool
  default     = false
}

variable "upload_presigned_ttl_seconds" {
  description = "S3 presigned URL expiration seconds"
  type        = number
  default     = 600
}
