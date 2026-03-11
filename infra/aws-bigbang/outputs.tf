output "frontend_alb_url" {
  description = "Frontend ALB URL"
  value       = "http://${aws_lb.frontend.dns_name}"
}

output "backend_api_url" {
  description = "Backend API ALB URL"
  value       = "http://${aws_lb.backend.dns_name}"
}

output "upload_api_url" {
  description = "API Gateway invoke URL for upload lambda"
  value       = aws_apigatewayv2_stage.upload.invoke_url
}

output "frontend_eip" {
  description = "Frontend EC2 Elastic IP"
  value       = aws_eip.frontend.public_ip
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = var.enable_rds ? aws_db_instance.postgres[0].address : null
}

output "uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = aws_s3_bucket.uploads.bucket
}

output "efs_id" {
  description = "EFS filesystem ID"
  value       = aws_efs_file_system.shared.id
}

output "runner_public_ip" {
  description = "Dedicated self-hosted runner public IP"
  value       = var.enable_self_hosted_runner ? aws_instance.runner[0].public_ip : null
}
