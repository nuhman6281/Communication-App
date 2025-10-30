#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        WebRTC Real-time Service Startup Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i:$port &>/dev/null; then
        echo -e "${RED}✗ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
        return 0
    fi
}

# Function to stop services
stop_services() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    docker-compose -f docker-compose.realtime.yml down
    exit 0
}

# Trap Ctrl+C
trap stop_services INT

# Check required ports
echo -e "${YELLOW}Checking required ports...${NC}"
PORTS_OK=true

if ! check_port 4000; then
    PORTS_OK=false
    echo -e "${YELLOW}  Tip: Run 'lsof -i:4000' to see what's using the port${NC}"
fi

if ! check_port 3478; then
    PORTS_OK=false
    echo -e "${YELLOW}  Tip: TURN/STUN server port 3478 is in use${NC}"
fi

if ! check_port 6380; then
    PORTS_OK=false
    echo -e "${YELLOW}  Tip: Redis port 6380 is in use${NC}"
fi

if [ "$PORTS_OK" = false ]; then
    echo -e "${RED}Please free up the required ports before starting${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &>/dev/null; then
    echo -e "${RED}Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All ports are available${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment variables from .env...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}No .env file found. Using default values.${NC}"
fi

# Set default values if not provided
export EXTERNAL_IP=${EXTERNAL_IP:-$(curl -s ifconfig.me)}
export TURN_USERNAME=${TURN_USERNAME:-username}
export TURN_PASSWORD=${TURN_PASSWORD:-password}
export REDIS_PASSWORD=${REDIS_PASSWORD:-redis-password}
export JWT_SECRET=${JWT_SECRET:-your-jwt-secret-key-change-in-production}
export CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:5173,http://localhost:3000}

echo -e "${BLUE}Configuration:${NC}"
echo -e "  External IP: ${GREEN}$EXTERNAL_IP${NC}"
echo -e "  CORS Origin: ${GREEN}$CORS_ORIGIN${NC}"
echo -e "  Real-time Port: ${GREEN}4000${NC}"
echo -e "  TURN/STUN Port: ${GREEN}3478${NC}"
echo ""

# Build and start services
echo -e "${YELLOW}Starting WebRTC Real-time Services...${NC}"
echo ""

# Start services with docker-compose
docker-compose -f docker-compose.realtime.yml up --build --remove-orphans

echo -e "\n${GREEN}Services stopped.${NC}"