#!/bin/bash

# Kill any existing processes
pkill -9 node 2>/dev/null
pkill -9 npm 2>/dev/null
sleep 2

echo "================================"
echo "SupportVision - Complete Startup"
echo "================================"

# Start backend
echo ""
echo "Starting backend..."
cd /Users/atharv/Desktop/Athomquest/backend
npm run start:dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 8

# Seed database
echo "Seeding database..."
node seed.js > /tmp/seed.log 2>&1

# Start frontend
echo ""
echo "Starting frontend..."
cd /Users/atharv/Desktop/Athomquest/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "================================"
echo "✅ Services Started"
echo "================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "Admin:    http://localhost:3000/admin"
echo ""
echo "Demo Credentials:"
echo "  Agent:    agent@demo.com / password123"
echo "  Customer: customer@demo.com / password123"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Seed:     tail -f /tmp/seed.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
