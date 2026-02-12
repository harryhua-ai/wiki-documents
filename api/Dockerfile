# Dockerfile for Wiki API Service
#
# ⚠️  PRODUCTION DEPLOYMENT NOTICE
# ========================================
# This project uses PM2 for process management and does NOT use Docker
# in production. See design/PRD.md §4.4:
# https://github.com/camthink-ai/wiki-documents/blob/main/design/PRD.md#44-deployment-方案no-docker-环境
#
# Production deployment uses:
# - PM2 process manager (api/pm2.config.js)
# - Native Node.js runtime
# - Nginx reverse proxy
#
# This Dockerfile is provided for:
# - Local development environment setup
# - Future containerization if needed (see "When to Docker" section below)
#
# ========================================================================
#
# When to Docker?
# ===============
# Consider Docker if you need:
# 1. Multiple service orchestration (Redis + PostgreSQL + Qdrant + API)
# 2. Horizontal scaling beyond 10,000 QPS
# 3. Isolated development environments
#
# Current architecture runs everything in one process:
# - Express (web framework)
# - SQLite + sqlite-vss (in-process vector DB)
# - Memory cache
# - LLM client (external API)
#
# Migration path (if needed in 6-12 months):
# - Phase 1: Docker Compose with single container (SQLite external)
# - Phase 2: Full containerization (Qdrant + PostgreSQL)
# - Phase 3: Kubernetes for auto-scaling
# ========================================================================
#
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
