#!/bin/bash

echo "🔧 Installing VidyutAI Infrastructure Locally (macOS)"
echo "====================================================="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "✅ Homebrew found"
echo ""

# Install PostgreSQL
echo "📦 Installing PostgreSQL 14..."
brew install postgresql@14

# Install Redis
echo "📦 Installing Redis..."
brew install redis

# Install Mosquitto
echo "📦 Installing Mosquitto MQTT..."
brew install mosquitto

# Start services
echo ""
echo "🚀 Starting services..."
brew services start postgresql@14
brew services start redis
brew services start mosquitto

echo ""
echo "✅ All services installed and started!"
echo ""
echo "Service URLs:"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo "  MQTT: localhost:1883"
echo ""
echo "Next steps:"
echo "1. Create database:"
echo "   createdb vidyutai"
echo "   psql vidyutai < backend/database/timescale-schema.sql"
echo ""
echo "2. Create backend/.env with:"
echo "   USE_TIMESCALE=true"
echo "   USE_REDIS=true"
echo "   USE_MQTT=true"
echo ""
echo "3. Restart your backend server"

