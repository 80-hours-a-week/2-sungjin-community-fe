resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/${local.name_prefix}/frontend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/${local.name_prefix}/backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.name_prefix}"
  retention_in_days = 90
}

resource "aws_cloudwatch_metric_alarm" "frontend_cpu_high" {
  alarm_name          = "${local.name_prefix}-frontend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Frontend EC2 CPU usage is high"

  dimensions = {
    InstanceId = aws_instance.frontend.id
  }
}

resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "${local.name_prefix}-backend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Backend EC2 CPU usage is high"

  dimensions = {
    InstanceId = aws_instance.backend.id
  }
}

resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_to_cloudwatch.arn
}
