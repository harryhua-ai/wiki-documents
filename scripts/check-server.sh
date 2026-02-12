#!/bin/bash
# Server Preparation Script for Wiki API Deployment
# Usage: ./scripts/check-server.sh

set -e

echo "=========================================="
echo "🖥  Server Environment Check"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Check 1: Node.js Version
# ============================================================================
echo -n "Checking Node.js version... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

    # Node.js 18+ required
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}✅ OK${NC} (v$NODE_VERSION)"
    else
        echo -e "${RED}❌ FAIL${NC} (v$NODE_VERSION - need v18+)"
        echo ""
        echo "Please install Node.js 18+:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        echo ""
        exit 1
    fi
else
    echo -e "${RED}❌ FAIL${NC} (Node.js not found)"
    echo ""
    echo "Please install Node.js 18+:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
    exit 1
fi

# ============================================================================
# Check 2: npm Version
# ============================================================================
echo -n "Checking npm version... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ OK${NC} (v$NPM_VERSION)"
else
    echo -e "${RED}❌ FAIL${NC} (npm not found)"
    exit 1
fi

# ============================================================================
# Check 3: PM2 Installation
# ============================================================================
echo -n "Checking PM2 installation... "
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✅ OK${NC} (v$PM2_VERSION)"
else
    echo -e "${YELLOW}⚠️  NOT FOUND${NC}"
    echo ""
    echo "Installing PM2 globally..."
    npm install -g pm2

    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✅ PM2 installed successfully${NC}"
    else
        echo -e "${RED}❌ PM2 installation failed${NC}"
        exit 1
    fi
fi

# ============================================================================
# Check 4: Port 3001 Availability
# ============================================================================
echo ""
echo "Checking port 3001 availability..."

if command -v netstat &> /dev/null; then
    PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep :3001 || echo "")
elif command -v ss &> /dev/null; then
    PORT_CHECK=$(ss -tlnp 2>/dev/null | grep :3001 || echo "")
elif command -v lsof &> /dev/null; then
    PORT_CHECK=$(lsof -i :3001 2>/dev/null || echo "")
else
    echo -e "${YELLOW}⚠️  WARNING${NC}: Cannot check port (netstat/ss/lsof not found)"
    PORT_CHECK="skip"
fi

if [ "$PORT_CHECK" = "skip" ]; then
    echo -e "${YELLOW}⚠️  SKIPPED${NC} (no tools available)"
elif [ -z "$PORT_CHECK" ]; then
    echo -e "${GREEN}✅ OK${NC} (port 3001 is available)"
else
    echo -e "${YELLOW}⚠️  IN USE${NC}"
    echo ""
    echo "Port 3001 is already in use:"
    echo "$PORT_CHECK"
    echo ""
    echo "Options:"
    echo "  1. Kill the process using port 3001:"
    echo "     sudo kill \$(lsof -t -i :3001 | grep LISTEN | awk '{print \$2}')"
    echo ""
    echo "  2. Use a different port (update api/pm2.config.js and api/nginx.conf)"
    echo ""
fi

# ============================================================================
# Check 5: Disk Space
# ============================================================================
echo ""
echo "Checking disk space..."

DISK_AVAILABLE=$(df -BG / | tail -1 | awk '{print $4}')
DISK_AVAILABLE_GB=$((DISK_AVAILABLE / 1024 / 1024))

if [ "$DISK_AVAILABLE_GB" -gt 2048 ]; then
    echo -e "${GREEN}✅ OK${NC} (${DISK_AVAILABLE_GB}GB available)"
elif [ "$DISK_AVAILABLE_GB" -gt 1024 ]; then
    echo -e "${YELLOW}⚠️  WARNING${NC} (${DISK_AVAILABLE_GB}GB available - recommend 2GB+)"
else
    echo -e "${RED}❌ FAIL${NC} (${DISK_AVAILABLE_GB}GB available - need at least 1GB)"
    echo ""
    echo "Please free up disk space:"
    echo "  sudo apt-get clean"
    echo "  sudo journalctl --vacuum-time=3d"
    echo ""
    exit 1
fi

# ============================================================================
# Check 6: Memory
# ============================================================================
echo ""
echo "Checking system memory..."

if [ -f /proc/meminfo ]; then
    TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    TOTAL_MEM_GB=$((TOTAL_MEM_KB / 1024 / 1024))

    if [ "$TOTAL_MEM_GB" -ge 2048 ]; then
        echo -e "${GREEN}✅ OK${NC} (${TOTAL_MEM_GB}GB total)"
    elif [ "$TOTAL_MEM_GB" -ge 1024 ]; then
        echo -e "${YELLOW}⚠️  WARNING${NC} (${TOTAL_MEM_GB}GB total - recommend 2GB+)"
    else
        echo -e "${RED}❌ FAIL${NC} (${TOTAL_MEM_GB}GB total - need at least 1GB)"
        echo ""
        echo "API service requires at least 1GB RAM for Node.js runtime + vector database"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED${NC} (cannot read /proc/meminfo)"
fi

# ============================================================================
# Check 7: Nginx Installation
# ============================================================================
echo ""
echo -n "Checking Nginx installation... "
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | grep -oP 'nginx/\K[0-9.]+')
    echo -e "${GREEN}✅ OK${NC} (v$NGINX_VERSION)"
else
    echo -e "${YELLOW}⚠️  NOT FOUND${NC}"
    echo ""
    echo "Please install Nginx:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y nginx"
    echo ""
fi

# ============================================================================
# Check 8: Git Installation
# ============================================================================
echo -n "Checking Git installation... "
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${YELLOW}⚠️  NOT FOUND${NC}"
    echo ""
    echo "Please install Git:"
    echo "  sudo apt-get install -y git"
    echo ""
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Server Environment Check Complete${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Configure Nginx: cp api/nginx.conf /etc/nginx/sites-available/wiki-api.conf"
echo "  2. Create symlink: ln -s /etc/nginx/sites-available/wiki-api.conf /etc/nginx/sites-enabled/"
echo "  3. Test Nginx: nginx -t"
echo "  4. Reload Nginx: systemctl reload nginx"
echo "  5. Deploy API: cd api && npm run build && pm2 start pm2.config.js"
echo ""
