#!/bin/bash

# EC2 User Data Script for VidyutAI Dashboard
# This script runs on first boot to setup the EC2 instance

set -e

echo "🚀 Setting up VidyutAI Dashboard on EC2..."

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /home/ec2-user/vidyutai
cd /home/ec2-user/vidyutai

# Download docker-compose.yml from your repository or S3
# For now, we'll create a placeholder
cat > docker-compose.yml <<'EOF'
# Download the actual docker-compose.yml from your repository
# Or upload it to S3 and download it here
EOF

# Set permissions
chown -R ec2-user:ec2-user /home/ec2-user/vidyutai

echo "✅ EC2 instance setup complete!"
echo "Next: Upload your application files and run 'docker-compose up -d'"

