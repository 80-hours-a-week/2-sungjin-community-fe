resource "aws_lb" "frontend" {
  name               = "${local.name_prefix}-alb-fe"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_frontend.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "${local.name_prefix}-alb-frontend"
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "${substr(local.name_prefix, 0, 12)}-tg-fe"
  port        = 3001
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/login"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "frontend_http" {
  load_balancer_arn = aws_lb.frontend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb" "backend" {
  name               = "${local.name_prefix}-alb-api"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_backend.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "${local.name_prefix}-alb-backend"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "${substr(local.name_prefix, 0, 12)}-tg-api"
  port        = 8000
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "backend_http" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.backend_instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.backend_ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/userdata/backend.sh.tftpl", {
    aws_region          = var.aws_region
    efs_id              = aws_efs_file_system.shared.id
    backend_repo_url    = var.backend_repo_url
    backend_repo_branch = var.backend_repo_branch
    database_url        = "postgresql+psycopg2://${var.db_username}:${urlencode(var.db_password)}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
    cors_allow_origins  = "http://${aws_lb.frontend.dns_name},https://${aws_lb.frontend.dns_name},http://localhost:3001,http://127.0.0.1:3001"
    upload_bucket       = aws_s3_bucket.uploads.bucket
  })

  tags = {
    Name = "${local.name_prefix}-ec2-backend"
    Role = "backend"
  }

  depends_on = [
    aws_db_instance.postgres,
    aws_efs_mount_target.private
  ]

  lifecycle {
    ignore_changes = [ami]
  }
}

resource "aws_instance" "frontend" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.frontend_instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.frontend_ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = templatefile("${path.module}/userdata/frontend.sh.tftpl", {
    aws_region           = var.aws_region
    efs_id               = aws_efs_file_system.shared.id
    frontend_repo_url    = var.frontend_repo_url
    frontend_repo_branch = var.frontend_repo_branch
    backend_api_url      = "http://${aws_lb.backend.dns_name}"
    file_upload_api_url  = aws_apigatewayv2_stage.upload.invoke_url
  })

  tags = {
    Name = "${local.name_prefix}-ec2-frontend"
    Role = "frontend"
  }

  depends_on = [
    aws_instance.backend,
    aws_apigatewayv2_stage.upload
  ]

  lifecycle {
    ignore_changes = [ami]
  }
}

resource "aws_eip" "frontend" {
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-frontend-eip"
  }
}

resource "aws_eip_association" "frontend" {
  instance_id   = aws_instance.frontend.id
  allocation_id = aws_eip.frontend.id
}

resource "aws_lb_target_group_attachment" "frontend" {
  target_group_arn = aws_lb_target_group.frontend.arn
  target_id        = aws_instance.frontend.id
  port             = 3001
}

resource "aws_lb_target_group_attachment" "backend" {
  target_group_arn = aws_lb_target_group.backend.arn
  target_id        = aws_instance.backend.id
  port             = 8000
}
