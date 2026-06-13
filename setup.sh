#!/bin/bash

echo "🚀 SupportVision Setup Script"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start infrastructure
echo "📦 Starting infrastructure services (PostgreSQL, Redis, LiveKit)..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

echo "🚀 Starting backend server..."
npm run start:dev &
BACKEND_PID=$!

cd ..

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Metrics:  http://localhost:3001/metrics"
echo ""
echo "👥 Create accounts:"
echo "   1. Register an Agent account"
echo "   2. Register a Customer account"
echo "   3. Agent creates a session"
echo "   4. Share the link with Customer"
echo ""
echo "🛑 To stop services:"
echo "   - Press Ctrl+C to stop frontend/backend"
echo "   - Run: docker-compose down"
echo ""

# Wait for user interrupt
wait
