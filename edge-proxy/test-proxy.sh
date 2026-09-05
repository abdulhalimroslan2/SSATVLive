#!/usr/bin/env bash
# =============================================================================
# CIDS TV - EDGE PROXY CACHE & REQUEST COALESCING TESTER
# =============================================================================

TARGET="${1:-http://localhost}"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Testing Edge Cache Proxy at:${NC} $TARGET"
echo "--------------------------------------------------------"

# 1. Healthcheck
echo -n "1. Testing /health endpoint... "
HEALTH=$(curl -s -w "%{http_code}" "$TARGET/health" -o /tmp/health.json)
if [ "$HEALTH" == "200" ]; then
    echo -e "${GREEN}[PASS] 200 OK${NC}"
    cat /tmp/health.json
    echo ""
else
    echo -e "${RED}[FAIL] Received HTTP $HEALTH${NC}"
fi

echo "--------------------------------------------------------"

# 2. Test Manifest Caching (.mpd)
TEST_MPD="$TARGET/astro-linear/dash-wv/linear/711/default_primary.mpd"
echo "2. Testing Manifest Request & Cache Status:"
echo "   Target: $TEST_MPD"

echo -n "   Request 1 (Expecting MISS or EXPIRED)... "
STATUS1=$(curl -s -I "$TEST_MPD" | grep -i "X-Cache-Status" | tr -d '\r\n')
echo -e "${YELLOW}$STATUS1${NC}"

sleep 0.5

echo -n "   Request 2 within 2 seconds (Expecting HIT)... "
STATUS2=$(curl -s -I "$TEST_MPD" | grep -i "X-Cache-Status" | tr -d '\r\n')
echo -e "${GREEN}$STATUS2${NC}"

echo "--------------------------------------------------------"

# 3. Test CORS & Security Headers
echo "3. Testing CORS & Header Sanitization:"
CORS_ORIGIN=$(curl -s -I "$TARGET/health" | grep -i "access-control-allow-origin" | tr -d '\r\n')
SERVER_HEADER=$(curl -s -I "$TARGET/health" | grep -i "server:" | tr -d '\r\n')

echo "   $CORS_ORIGIN"
if [ -z "$SERVER_HEADER" ]; then
    echo -e "   ${GREEN}✓ server_tokens off (Server version hidden)${NC}"
fi

echo "--------------------------------------------------------"
echo -e "${GREEN}Edge Proxy test completed!${NC}"
