#!/bin/bash

echo "🚀 VidyutAI Infrastructure Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. You have 3 options:"
    echo ""
    echo "Option 1: Install Docker Desktop (Recommended)"
    echo "  Download from: https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "Option 2: Install services locally with Homebrew"
    echo "  Run: ./install-services-local.sh"
    echo ""
    echo "Option 3: Use cloud services (free tiers available)"
    echo "  - TimescaleDB Cloud: https://www.timescale.com/cloud"
    echo "  - Redis Cloud: https://redis.com/try-free/"
    echo "  - HiveMQ Cloud: https://www.hivemq.com/mqtt-cloud-broker/"
    echo ""
    exit 1
fi

echo "✅ Docker found"
echo ""

# Start infrastructure
echo "Starting infrastructure services..."
docker compose -f docker-compose.infrastructure.yml up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check status
echo ""
echo "Service Status:"
docker compose -f docker-compose.infrastructure.yml ps

echo ""
echo "✅ Infrastructure started!"
echo ""
echo "Next steps:"
echo "1. Create backend/.env file with:"
echo "   USE_TIMESCALE=true"
echo "   USE_REDIS=true"
echo "   USE_MQTT=true"
echo ""
echo "2. Restart your backend server"
echo ""
echo "3. Check logs:"
echo "   docker compose -f docker-compose.infrastructure.yml logs -f"
echo ""
echo "To stop infrastructure:"
echo "   docker compose -f docker-compose.infrastructure.yml down"

