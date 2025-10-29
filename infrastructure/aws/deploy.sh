#!/bin/bash

# VidyutAI Dashboard - AWS Deployment Script
# This script deploys the application to AWS EC2

set -e

echo "🚀 VidyutAI Dashboard - AWS Deployment"
echo "======================================"

# Configuration
APP_NAME="vidyutai-dashboard"
AWS_REGION="${AWS_REGION:-ap-south-1}"  # Mumbai region
INSTANCE_TYPE="${INSTANCE_TYPE:-t2.micro}"  # Free tier eligible

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build Docker images
echo -e "${YELLOW}📦 Building Docker images...${NC}"
docker-compose build

# Save images to tar files
echo -e "${YELLOW}💾 Saving Docker images...${NC}"
docker save vidyutai-dashboard-frontend -o /tmp/vidyutai-frontend.tar
docker save vidyutai-dashboard-backend -o /tmp/vidyutai-backend.tar
docker save vidyutai-dashboard-ai-service -o /tmp/vidyutai-ai-service.tar

echo -e "${GREEN}✅ Docker images saved${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Launch an EC2 instance (t2.micro for free tier)"
echo "2. Install Docker and Docker Compose on EC2"
echo "3. Copy the tar files to EC2"
echo "4. Load images with: docker load -i <image>.tar"
echo "5. Run: docker-compose up -d"
echo ""
echo "For detailed instructions, see: infrastructure/aws/README.md"

