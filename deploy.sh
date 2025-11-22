#!/bin/bash

# Smart Car Parking Deployment Script
# This script deploys the latest Docker images to EC2

set -e

echo "🚀 Starting deployment..."

# Configuration
BACKEND_IMAGE="localhost:8082/smart-parking-backend:latest"
FRONTEND_IMAGE="localhost:8082/smart-parking-frontend:latest"
BACKEND_CONTAINER="smart-parking-backend"
FRONTEND_CONTAINER="smart-parking-frontend"

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker stop $BACKEND_CONTAINER || true
docker stop $FRONTEND_CONTAINER || true
docker rm $BACKEND_CONTAINER || true
docker rm $FRONTEND_CONTAINER || true

# Start new containers using docker-compose
echo "🐳 Starting new containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Health checks
echo "❤️ Performing health checks..."
if curl -f http://localhost:8081/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment completed successfully!"
echo "Backend: http://localhost:8081"
echo "Frontend: http://localhost:80"
