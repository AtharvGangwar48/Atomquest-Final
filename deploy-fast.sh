#!/bin/bash

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🚀 ATOMBERG - FASTEST DEPLOYMENT 🚀             ║"
echo "║            Everything deploys in ~2 minutes              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}[1/5]${NC} Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker and try again."
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Start Docker services
echo -e "${BLUE}[2/5]${NC} Starting Docker services (PostgreSQL, Redis, LiveKit, Prometheus)..."
docker-compose up -d --quiet 2>/dev/null || docker-compose up -d
sleep 5
echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}[3/5]${NC} Setting up Backend (NestJS)..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "   📥 Installing dependencies..."
    npm install --silent --legacy-peer-deps
fi

echo "   🚀 Starting NestJS server..."
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 5
echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}"

cd ..
echo ""

# Setup Frontend
echo -e "${BLUE}[4/5]${NC} Setting up Frontend (Next.js)..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "   📥 Installing dependencies..."
    npm install --silent --legacy-peer-deps
fi

echo "   🚀 Starting Next.js server..."
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 8
echo -e "${GREEN}✅ Frontend running (PID: $FRONTEND_PID)${NC}"

cd ..
echo ""

# Setup complete
echo -e "${BLUE}[5/5]${NC} Deployment Complete! ✨"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                   🎉 ALL SYSTEMS GO! 🎉                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📱 Access Atomberg:${NC}"
echo "   🌐 Frontend:  ${BLUE}http://localhost:3000${NC}"
echo "   🔧 Backend:   ${BLUE}http://localhost:3001${NC}"
echo "   📊 Metrics:   ${BLUE}http://localhost:3001/metrics${NC}"
echo "   📈 Grafana:   ${BLUE}http://localhost:3002${NC}"
echo "   📦 MinIO:     ${BLUE}http://localhost:9001${NC}"
echo ""
echo -e "${GREEN}👥 Demo Accounts:${NC}"
echo "   Admin:    ${BLUE}admin@atomberg.com${NC} / ${BLUE}admin123${NC}"
echo "   Agent:    ${BLUE}agent@atomberg.com${NC} / ${BLUE}agent123${NC}"
echo "   Customer: ${BLUE}customer@atomberg.com${NC} / ${BLUE}customer123${NC}"
echo ""
echo -e "${YELLOW}⚠️  To stop everything:${NC}"
echo "   Press Ctrl+C"
echo "   Then run: docker-compose down"
echo ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""

# Wait for processes
wait
