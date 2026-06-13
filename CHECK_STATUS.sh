#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🚀 ATOMBERG - DEPLOYMENT STATUS CHECK 🚀        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "🔍 Checking Services..."
echo ""

# Check Frontend
echo -n "🌐 Frontend (http://localhost:3000): "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

# Check Backend
echo -n "🔧 Backend (http://localhost:3001): "
if curl -s http://localhost:3001/metrics > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

# Check Docker Services
echo -n "🐳 Docker Services: "
RUNNING=$(docker ps --format "table {{.Names}}" | wc -l)
if [ $RUNNING -gt 1 ]; then
    echo "✅ RUNNING ($((RUNNING-1)) containers)"
else
    echo "❌ NOT RUNNING"
fi

# Check PostgreSQL
echo -n "🗄️  PostgreSQL: "
if docker exec atomquest-final-postgres-1 pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

# Check Redis
echo -n "🔴 Redis: "
if docker exec atomquest-final-redis-1 redis-cli ping > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

# Check LiveKit
echo -n "📹 LiveKit: "
if curl -s http://localhost:7880 > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

# Check Prometheus
echo -n "📊 Prometheus: "
if curl -s http://localhost:9090 > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

# Check Grafana
echo -n "📈 Grafana: "
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ NOT RUNNING"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                     ACCESS LINKS                         ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║                                                           ║"
echo "║  🌐 Frontend:    http://localhost:3000                  ║"
echo "║  🔧 Backend:     http://localhost:3001                  ║"
echo "║  📊 Metrics:     http://localhost:3001/metrics          ║"
echo "║  📈 Grafana:     http://localhost:3002                  ║"
echo "║  🎥 LiveKit:     ws://localhost:7880                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "👥 Demo Accounts:"
echo "   Admin:    admin@atomberg.com / admin123"
echo "   Agent:    agent@atomberg.com / agent123"
echo "   Customer: customer@atomberg.com / customer123"
echo ""
