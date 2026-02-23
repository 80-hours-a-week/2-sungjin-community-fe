data "archive_file" "upload_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/index.py"
  output_path = "${path.module}/lambda/upload_lambda.zip"
}

resource "aws_lambda_function" "upload" {
  function_name = "${local.name_prefix}-upload"
  role          = aws_iam_role.lambda_upload.arn
  runtime       = "python3.12"
  handler       = "index.handler"
  filename      = data.archive_file.upload_lambda.output_path
  timeout       = 15

  source_code_hash = data.archive_file.upload_lambda.output_base64sha256

  environment {
    variables = {
      UPLOAD_BUCKET = aws_s3_bucket.uploads.bucket
      AWS_REGION    = var.aws_region
      URL_TTL       = tostring(var.upload_presigned_ttl_seconds)
    }
  }
}

resource "aws_apigatewayv2_api" "upload" {
  name          = "${local.name_prefix}-upload-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type", "authorization"]
    allow_methods = ["OPTIONS", "POST"]
    allow_origins = [
      "http://${aws_lb.frontend.dns_name}",
      "https://${aws_lb.frontend.dns_name}",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ]
    max_age = 3600
  }
}

resource "aws_apigatewayv2_integration" "upload" {
  api_id                 = aws_apigatewayv2_api.upload.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.upload.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "upload_url" {
  api_id    = aws_apigatewayv2_api.upload.id
  route_key = "POST /upload-url"
  target    = "integrations/${aws_apigatewayv2_integration.upload.id}"
}

resource "aws_apigatewayv2_stage" "upload" {
  api_id      = aws_apigatewayv2_api.upload.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.upload.execution_arn}/*/*"
}
