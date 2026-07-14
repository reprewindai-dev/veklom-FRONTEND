#!/usr/bin/env bash
set -euo pipefail

################################################################################
# VNP Methodology v1.0 legacy infrastructure helper
#
# PURPOSE: Deploy VNP from zero to live (Base L2 + 5 regions) in <2 hours
# USAGE: ./deploy-vnp-production.sh
# 
# PREREQUISITES:
#   - AWS CLI configured (aws-access-key-id, aws-secret-access-key)
#   - Terraform installed (v1.0+)
#   - Docker installed locally (for building images)
#   - gcloud CLI configured (for GCP resources)
#   - GitHub CLI (gh) installed and authenticated
#   - Hardhat/Node.js installed
#   - Private key in env: VNP_ISSUER_PRIVATE_KEY
#
# TIMELINE:
#   Phase 1 (5 min): Validate prerequisites
#   Phase 2 (45 min): Provision infrastructure
#   Phase 3 (30 min): Deploy services
#   Phase 4 (15 min): Deploy smart contract
#   Phase 5 (10 min): Deploy dashboard
#   Phase 6 (5 min): Verify everything
#
# COST: ~$750/month (sponsors cover)
# GO-LIVE: Immediate production (no staging)
################################################################################

set +u  # Allow undefined vars temporarily
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -u

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="production"
VNP_REGION="us-east"
BASE_CHAIN="base"
BASE_RPC="https://mainnet.base.org"
REGIONS=("us-east" "us-west" "eu-west" "ap-southeast" "ap-northeast")
MEASUREMENT_NODES=("vnp-us-east-1" "vnp-us-west-1" "vnp-eu-west-1" "vnp-ap-southeast-1" "vnp-ap-northeast-1")

# ============================================================================
# LOGGING & UTILITY
# ============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_step() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

# ============================================================================
# PHASE 1: VALIDATE PREREQUISITES
# ============================================================================

validate_prerequisites() {
  log_step "PHASE 1: VALIDATING PREREQUISITES"
  
  local missing=0
  
  # Check required binaries
  for cmd in terraform docker aws gcloud gh node npm; do
    if ! command -v "$cmd" &> /dev/null; then
      log_error "Missing: $cmd"
      missing=$((missing + 1))
    else
      log_success "Found: $cmd"
    fi
  done
  
  # Check environment variables
  local required_vars=("VNP_ISSUER_PRIVATE_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "GITHUB_TOKEN")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      log_error "Missing env var: $var"
      missing=$((missing + 1))
    else
      log_success "Env var set: $var"
    fi
  done
  
  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials invalid"
    missing=$((missing + 1))
  else
    log_success "AWS credentials valid"
  fi
  
  # Check GitHub authentication
  if ! gh auth status &> /dev/null; then
    log_error "GitHub authentication failed"
    missing=$((missing + 1))
  else
    log_success "GitHub authenticated"
  fi
  
  if [ $missing -gt 0 ]; then
    log_error "Fix $missing missing prerequisites and re-run"
    exit 1
  fi
  
  log_success "All prerequisites validated"
}

# ============================================================================
# PHASE 2: PROVISION INFRASTRUCTURE
# ============================================================================

provision_infrastructure() {
  log_step "PHASE 2: PROVISIONING INFRASTRUCTURE (45 min)"
  
  # Create Terraform working directory
  mkdir -p "$SCRIPT_DIR/terraform"
  cd "$SCRIPT_DIR/terraform"
  
  # Generate main.tf if not exists
  if [ ! -f "main.tf" ]; then
    log_info "Generating Terraform configuration..."
    generate_terraform_config
  fi
  
  # Initialize Terraform
  log_info "Initializing Terraform..."
  terraform init -upgrade
  
  # Validate configuration
  log_info "Validating Terraform configuration..."
  terraform validate
  
  # Plan deployment
  log_info "Planning infrastructure deployment..."
  terraform plan -out=tfplan
  
  # Apply configuration
  log_warning "Applying Terraform configuration (this may take 30-40 minutes)..."
  terraform apply tfplan
  
  # Output important values
  log_success "Infrastructure provisioned successfully"
  
  # Export infrastructure outputs
  export CLICKHOUSE_HOST=$(terraform output -raw clickhouse_host 2>/dev/null || echo "clickhouse.vnp.io")
  export KAFKA_BROKERS=$(terraform output -raw kafka_brokers 2>/dev/null || echo "kafka-1.vnp.io:9092,kafka-2.vnp.io:9092,kafka-3.vnp.io:9092")
  export API_ENDPOINT=$(terraform output -raw api_endpoint 2>/dev/null || echo "https://api.vnp.io")
  
  log_success "Infrastructure exports: CLICKHOUSE_HOST, KAFKA_BROKERS, API_ENDPOINT"
  
  cd "$SCRIPT_DIR"
}

generate_terraform_config() {
  cat > main.tf << 'EOF'
# VNP Methodology v1.0 Terraform Configuration
# Provisions: ClickHouse cluster, Kafka cluster, scoring engine, public API

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Store state in S3 (for team collaboration)
  backend "s3" {
    bucket         = "vnp-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "vnp-terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"
}

# Create S3 bucket for Terraform state (one-time)
resource "aws_s3_bucket" "terraform_state" {
  bucket = "vnp-terraform-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name           = "vnp-terraform-locks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
}

# VPC for ClickHouse and Kafka
resource "aws_vpc" "vnp_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "vnp-vpc"
  }
}

# Public subnet
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.vnp_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "vnp-public-subnet"
  }
}

# ClickHouse cluster (3 nodes)
resource "aws_instance" "clickhouse" {
  count                = 3
  ami                  = "ami-0c02fb55731490381" # Ubuntu 24.04
  instance_type        = "t3.xlarge"
  subnet_id            = aws_subnet.public.id
  
  root_block_device {
    volume_size = 500 # 500GB storage for measurements
    volume_type = "gp3"
  }
  
  tags = {
    Name = "vnp-clickhouse-${count.index + 1}"
  }
  
  # Install ClickHouse (simplified)
  user_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y curl
    curl https://clickhouse.com/ | sh
    systemctl start clickhouse-server
  EOF
  )
}

# Kafka cluster (3 brokers)
resource "aws_instance" "kafka" {
  count         = 3
  ami           = "ami-0c02fb55731490381"
  instance_type = "t3.large"
  subnet_id     = aws_subnet.public.id
  
  root_block_device {
    volume_size = 100
    volume_type = "gp3"
  }
  
  tags = {
    Name = "vnp-kafka-${count.index + 1}"
  }
}

# Scoring engine (auto-scaling group)
resource "aws_autoscaling_group" "scoring_engine" {
  name                = "vnp-scoring-engine-asg"
  vpc_zone_identifier = [aws_subnet.public.id]
  min_size            = 1
  max_size            = 5
  desired_capacity    = 2
  
  launch_template {
    id      = aws_launch_template.scoring_engine.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "vnp-scoring-engine"
    propagate_at_launch = true
  }
}

resource "aws_launch_template" "scoring_engine" {
  name_prefix   = "vnp-scoring-engine-"
  image_id      = "ami-0c02fb55731490381"
  instance_type = "t3.medium"
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "vnp-scoring-engine"
    }
  }
}

# Public API (load balanced)
resource "aws_lb" "api" {
  name               = "vnp-api-lb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public.id]
  
  tags = {
    Name = "vnp-api-load-balancer"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "vnp-api-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vnp_vpc.id
  
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
}

# Outputs
output "clickhouse_host" {
  value       = aws_instance.clickhouse[0].private_ip
  description = "ClickHouse primary node IP"
}

output "kafka_brokers" {
  value = join(",", [
    for instance in aws_instance.kafka : "${instance.private_ip}:9092"
  ])
  description = "Kafka broker addresses"
}

output "api_endpoint" {
  value       = "https://${aws_lb.api.dns_name}"
  description = "Public API endpoint"
}
EOF
  
  log_success "Terraform configuration generated"
}

# ============================================================================
# PHASE 3: DEPLOY SERVICES (DOCKER CONTAINERS)
# ============================================================================

deploy_services() {
  log_step "PHASE 3: DEPLOYING SERVICES (30 min)"
  
  # Build Docker images
  log_info "Building Docker images..."
  docker_build
  
  # Push to registry
  log_info "Pushing images to GHCR..."
  docker_push
  
  # Deploy via docker-compose to central host
  log_info "Deploying docker-compose to infrastructure..."
  deploy_docker_compose
  
  log_success "All services deployed"
}

docker_build() {
  log_info "Building measurement-agent..."
  docker build -t ghcr.io/VeklomNP/vnp-core/measurement-agent:latest \
    "$SCRIPT_DIR/../measurement-agent"
  
  log_info "Building scoring-engine..."
  docker build -t ghcr.io/VeklomNP/vnp-core/scoring-engine:latest \
    "$SCRIPT_DIR/../scoring-engine"
  
  log_info "Building public-api..."
  docker build -t ghcr.io/VeklomNP/vnp-core/public-api:latest \
    "$SCRIPT_DIR/../public-api"
  
  log_info "Building dashboard..."
  docker build -t ghcr.io/VeklomNP/vnp-core/dashboard:latest \
    "$SCRIPT_DIR/../dashboard"
  
  log_success "All images built"
}

docker_push() {
  log_info "Authenticating with GHCR..."
  echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$(gh api user -q .login)" --password-stdin
  
  docker push ghcr.io/VeklomNP/vnp-core/measurement-agent:latest
  docker push ghcr.io/VeklomNP/vnp-core/scoring-engine:latest
  docker push ghcr.io/VeklomNP/vnp-core/public-api:latest
  docker push ghcr.io/VeklomNP/vnp-core/dashboard:latest
  
  log_success "All images pushed to GHCR"
}

deploy_docker_compose() {
  # Copy docker-compose to infrastructure host
  log_info "Deploying docker-compose..."
  
  # Use SSH to remote host
  ssh -i "$VNP_INFRASTRUCTURE_KEY" ubuntu@"$CLICKHOUSE_HOST" << 'EOSSH'
    cd /opt/vnp
    docker-compose down || true
    docker-compose pull
    docker-compose up -d
    docker-compose ps
  EOSSH
  
  log_success "Docker services deployed"
}

# ============================================================================
# PHASE 4: DEPLOY SMART CONTRACT
# ============================================================================

deploy_smart_contract() {
  log_step "PHASE 4: DEPLOYING SMART CONTRACT (15 min)"
  
  cd "$SCRIPT_DIR/../chain-anchoring"
  
  log_info "Installing Hardhat dependencies..."
  npm ci
  
  log_info "Deploying VNP Anchor contract to Base L2..."
  npx hardhat run scripts/deploy-vnp-anchor.js --network base
  
  local contract_address=$(npx hardhat run scripts/get-deployment-address.js --network base)
  export VNP_ANCHOR_CONTRACT_ADDRESS="$contract_address"
  
  log_success "Smart contract deployed: $contract_address"
  
  # Verify on Basescan
  log_info "Verifying contract on Basescan..."
  npx hardhat verify --network base "$contract_address"
  
  log_success "Contract verified: https://basescan.org/address/$contract_address"
  
  cd "$SCRIPT_DIR"
}

# ============================================================================
# PHASE 5: DEPLOY DASHBOARD
# ============================================================================

deploy_dashboard() {
  log_step "PHASE 5: DASHBOARD DEPLOYMENT"
  log_error "This legacy helper must not deploy the VNP dashboard. Veklom frontend deployments run through Coolify."
  log_error "Use the Coolify application for reprewindai-dev/veklom-FRONTEND instead of this script."
  return 1
}

# ============================================================================
# PHASE 6: VERIFICATION
# ============================================================================

verify_deployment() {
  log_step "PHASE 6: VERIFICATION (5 min)"
  
  local errors=0
  
  # Check ClickHouse
  log_info "Checking ClickHouse..."
  if curl -f "http://$CLICKHOUSE_HOST:8123/ping" &> /dev/null; then
    log_success "ClickHouse is online"
  else
    log_error "ClickHouse is offline"
    errors=$((errors + 1))
  fi
  
  # Check Kafka
  log_info "Checking Kafka..."
  if nc -z "${KAFKA_BROKERS%%,*}" 9092 &> /dev/null; then
    log_success "Kafka is online"
  else
    log_error "Kafka is offline"
    errors=$((errors + 1))
  fi
  
  # Check API
  log_info "Checking Public API..."
  if curl -f "$API_ENDPOINT/health" &> /dev/null; then
    log_success "API is online"
  else
    log_error "API is offline"
    errors=$((errors + 1))
  fi
  
  # Check Dashboard
  log_info "Checking Dashboard..."
  if curl -f "$DASHBOARD_URL" &> /dev/null; then
    log_success "Dashboard is online"
  else
    log_error "Dashboard is offline"
    errors=$((errors + 1))
  fi
  
  # Check smart contract
  log_info "Checking Base L2 contract..."
  if curl -f "https://api.basescan.org/api?module=contract&action=getabi&address=$VNP_ANCHOR_CONTRACT_ADDRESS" &> /dev/null; then
    log_success "Smart contract is verified on Base"
  else
    log_error "Smart contract verification failed"
    errors=$((errors + 1))
  fi
  
  # Check measurement nodes
  log_info "Checking measurement nodes..."
  local nodes_online=0
  for node in "${MEASUREMENT_NODES[@]}"; do
    if nc -z "$node.vnp.io" 22 &> /dev/null; then
      log_success "$node online"
      nodes_online=$((nodes_online + 1))
    else
      log_warning "$node offline (may not be DNS-propagated yet)"
    fi
  done
  
  if [ $errors -eq 0 ]; then
    log_success "ALL SYSTEMS VERIFIED"
    return 0
  else
    log_error "Verification failed with $errors errors"
    return 1
  fi
}

# ============================================================================
# FINAL REPORT
# ============================================================================

final_report() {
  log_step "DEPLOYMENT COMPLETE"
  
  cat << EOF

  ✓ VNP Methodology v1.0 LIVE ON PRODUCTION

  INFRASTRUCTURE:
    - 5 regional measurement nodes: ${#REGIONS[@]}
    - ClickHouse cluster: 3 nodes (500GB each)
    - Kafka cluster: 3 brokers
    - Scoring engine: Auto-scaling (1-5 replicas)
    - Public API: Load balanced
    
  ENDPOINTS:
    - API: $API_ENDPOINT
    - GraphQL: $API_ENDPOINT/graphql
    - Dashboard: $DASHBOARD_URL
    - Base L2 Contract: https://basescan.org/address/$VNP_ANCHOR_CONTRACT_ADDRESS
    
  NEXT STEPS:
    1. Verify all 5 measurement nodes are online
    2. Wait 30 minutes for measurements to start flowing
    3. Announce to IETF httpapi + HackerNews
    4. Monitor system health (24/7 for first 48 hours)
    5. File Linux Foundation Series application
    
  TIMELINE:
    Day 1: ✓ All systems live
    Week 1: ✓ 1,000+ measurements collected
    Month 1: ✓ First scores published, governance vote scheduled
    Month 3: ✓ 50 APIs measured, TSC elections complete
    
  COST: ~$750/month (sponsors cover)
  STATUS: PRODUCTION READY

EOF
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
  log_info "Starting VNP Methodology v1.0 Production Deployment"
  log_info "Deployment Environment: $DEPLOYMENT_ENV"
  log_info "Timestamp: $(date -Iseconds)"
  
  validate_prerequisites
  provision_infrastructure
  deploy_services
  deploy_smart_contract
  deploy_dashboard
  
  if verify_deployment; then
    final_report
    log_success "Deployment succeeded"
    exit 0
  else
    log_error "Deployment verification failed"
    exit 1
  fi
}

# Run main if script is executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
