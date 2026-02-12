#!/bin/bash
# Deployment script for Wiki API service
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
SERVER_HOST=${SERVER_HOST:-"your-server.com"}
SERVER_USER=${SERVER_USER:-"root"}
DEPLOY_PATH=${DEPLOY_PATH:-"/var/www/wiki-api"}

echo "=========================================="
echo "Deploying Wiki API to $ENVIRONMENT"
echo "=========================================="

# Build locally
echo "Building API locally..."
npm ci
npm run build

# Create deployment package
echo "Creating deployment package..."
tar -czf wiki-api-deploy.tar.gz \
    dist/ \
    node_modules/ \
    package.json \
    package-lock.json \
    pm2.config.js \
    .env.production.example

# Upload to server
echo "Uploading to server..."
scp wiki-api-deploy.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/

# Deploy on server
echo "Deploying on server..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
set -e
DEPLOY_PATH="/var/www/wiki-api"

# Create directories
mkdir -p $DEPLOY_PATH/logs
mkdir -p $DEPLOY_PATH/dist

# Extract deployment package
cd $DEPLOY_PATH
tar -xzf /tmp/wiki-api-deploy.tar.gz
rm /tmp/wiki-api-deploy.tar.gz

# Ensure .env.production exists
if [ ! -f .env.production ]; then
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo "WARNING: .env.production created from example. Please configure it manually!"
    fi
fi

# Stop existing PM2 process
if pm2 list | grep -q "wiki-api"; then
    echo "Stopping existing API service..."
    pm2 stop wiki-api || true
    pm2 delete wiki-api || true
fi

# Start with PM2
echo "Starting API service with PM2..."
pm2 start pm2.config.js --name wiki-api

# Save PM2 process list
pm2 save

# Show status
pm2 list
pm2 logs wiki-api --nostream --lines 20

echo "API deployment completed successfully!"
ENDSSH

# Clean up local package
rm wiki-api-deploy.tar.gz

echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
