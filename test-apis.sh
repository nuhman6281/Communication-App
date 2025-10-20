#!/bin/bash

# API Testing Script
BASE_URL="http://localhost:3000/api/v1"
TOKEN=""
WORKSPACE_ID=""

# Generate unique credentials for testing
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_USERNAME="test${TIMESTAMP}"

echo "========================================="
echo "Comprehensive API Testing"
echo "========================================="
echo "Test User: $TEST_USERNAME"
echo "Test Email: $TEST_EMAIL"
echo ""

# Test 1: Register
echo "[1] Testing POST /auth/register"
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\"}")

echo "$REGISTER" | head -5
if echo "$REGISTER" | grep -q "verificationToken"; then
    echo "✓ Register SUCCESS"
    VERIFICATION_TOKEN=$(echo "$REGISTER" | grep -o '"verificationToken":"[^"]*' | sed 's/"verificationToken":"//')
    echo "Verification Token: ${VERIFICATION_TOKEN:0:30}..."

    # Verify email
    echo "[1b] Testing POST /auth/verify-email"
    VERIFY=$(curl -s -X POST "$BASE_URL/auth/verify-email" \
      -H "Content-Type: application/json" \
      -d "{\"token\":\"$VERIFICATION_TOKEN\"}")

    if echo "$VERIFY" | grep -q "verified successfully"; then
        echo "✓ Email verification SUCCESS"
    else
        echo "⊙ Email verification response:"
        echo "$VERIFY"
    fi

    # Now try login
    echo "[1c] Testing POST /auth/login"
    LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"identifier\":\"$TEST_EMAIL\",\"password\":\"Test123!@#\"}")

    if echo "$LOGIN" | grep -q "accessToken"; then
        echo "✓ Login SUCCESS"
        TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
        echo "Token: ${TOKEN:0:30}..."
    else
        echo "✗ Login FAILED"
        echo "$LOGIN"
        exit 1
    fi
else
    # User already exists, try login directly
    echo "⊙ Register (user may exist), trying login..."
    LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"identifier\":\"$TEST_EMAIL\",\"password\":\"Test123!@#\"}")

    if echo "$LOGIN" | grep -q "accessToken"; then
        echo "✓ Login SUCCESS"
        TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
        echo "Token: ${TOKEN:0:30}..."
    else
        echo "✗ Auth FAILED"
        echo "$LOGIN"
        exit 1
    fi
fi
echo ""

# Test 2: Get current user
echo "[2] Testing GET /users/me"
ME=$(curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME" | grep -q '"id"'; then
    echo "✓ Get current user SUCCESS"
else
    echo "✗ Get current user FAILED"
    echo "$ME"
fi
echo ""

# Test 3: Create workspace
echo "[3] Testing POST /workspaces"
CREATE_WS=$(curl -s -X POST "$BASE_URL/workspaces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"API Test Workspace\",\"slug\":\"api-test-ws-${TIMESTAMP}\",\"description\":\"Testing workspace APIs\"}")

echo "$CREATE_WS" | head -10
if echo "$CREATE_WS" | grep -q '"id"'; then
    echo "✓ Create workspace SUCCESS"
    WORKSPACE_ID=$(echo "$CREATE_WS" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
    echo "Workspace ID: $WORKSPACE_ID"
else
    echo "✗ Create workspace FAILED"
fi
echo ""

# Test 4: Get workspaces
echo "[4] Testing GET /workspaces"
GET_WS=$(curl -s -X GET "$BASE_URL/workspaces" \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_WS" | grep -q '"workspaces"'; then
    echo "✓ Get workspaces SUCCESS"
    echo "$GET_WS" | head -10
else
    echo "✗ Get workspaces FAILED"
    echo "$GET_WS"
fi
echo ""

# Test 5: Get workspace by ID
if [ -n "$WORKSPACE_ID" ]; then
    echo "[5] Testing GET /workspaces/:id"
    GET_ONE_WS=$(curl -s -X GET "$BASE_URL/workspaces/$WORKSPACE_ID" \
      -H "Authorization: Bearer $TOKEN")

    if echo "$GET_ONE_WS" | grep -q '"id"'; then
        echo "✓ Get workspace by ID SUCCESS"
    else
        echo "✗ Get workspace by ID FAILED"
        echo "$GET_ONE_WS"
    fi
    echo ""
fi

# Test 6: Update workspace
if [ -n "$WORKSPACE_ID" ]; then
    echo "[6] Testing PATCH /workspaces/:id"
    UPDATE_WS=$(curl -s -X PATCH "$BASE_URL/workspaces/$WORKSPACE_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"description":"Updated via API test"}')

    if echo "$UPDATE_WS" | grep -q '"id"'; then
        echo "✓ Update workspace SUCCESS"
    else
        echo "✗ Update workspace FAILED"
        echo "$UPDATE_WS"
    fi
    echo ""
fi

# Test 7: Get workspace members
if [ -n "$WORKSPACE_ID" ]; then
    echo "[7] Testing GET /workspaces/:id/members"
    GET_MEMBERS=$(curl -s -X GET "$BASE_URL/workspaces/$WORKSPACE_ID/members" \
      -H "Authorization: Bearer $TOKEN")

    if echo "$GET_MEMBERS" | grep -q '"members"'; then
        echo "✓ Get workspace members SUCCESS"
    else
        echo "✗ Get workspace members FAILED"
        echo "$GET_MEMBERS"
    fi
    echo ""
fi

# Test 8: Generate invite link
if [ -n "$WORKSPACE_ID" ]; then
    echo "[8] Testing POST /workspaces/:id/invite/generate"
    GEN_INVITE=$(curl -s -X POST "$BASE_URL/workspaces/$WORKSPACE_ID/invite/generate" \
      -H "Authorization: Bearer $TOKEN")

    if echo "$GEN_INVITE" | grep -q '"inviteCode"'; then
        echo "✓ Generate invite link SUCCESS"
        INVITE_CODE=$(echo "$GEN_INVITE" | grep -o '"inviteCode":"[^"]*' | sed 's/"inviteCode":"//')
        echo "Invite Code: $INVITE_CODE"
    else
        echo "✗ Generate invite link FAILED"
        echo "$GEN_INVITE"
    fi
    echo ""
fi

# Test 9: Get workspace channels
if [ -n "$WORKSPACE_ID" ]; then
    echo "[9] Testing GET /workspaces/:id/channels"
    GET_CHANNELS=$(curl -s -X GET "$BASE_URL/workspaces/$WORKSPACE_ID/channels" \
      -H "Authorization: Bearer $TOKEN")

    if echo "$GET_CHANNELS" | grep -q '"channels"'; then
        echo "✓ Get workspace channels SUCCESS"
    else
        echo "✗ Get workspace channels FAILED"
        echo "$GET_CHANNELS"
    fi
    echo ""
fi

# Test 10: Get workspace groups
if [ -n "$WORKSPACE_ID" ]; then
    echo "[10] Testing GET /workspaces/:id/groups"
    GET_GROUPS=$(curl -s -X GET "$BASE_URL/workspaces/$WORKSPACE_ID/groups" \
      -H "Authorization: Bearer $TOKEN")

    if echo "$GET_GROUPS" | grep -q '"groups"'; then
        echo "✓ Get workspace groups SUCCESS"
    else
        echo "✗ Get workspace groups FAILED"
        echo "$GET_GROUPS"
    fi
    echo ""
fi

# Test 11: Get conversations
echo "[11] Testing GET /conversations"
GET_CONVOS=$(curl -s -X GET "$BASE_URL/conversations" \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_CONVOS" | grep -q '"items"'; then
    echo "✓ Get conversations SUCCESS"
else
    echo "✗ Get conversations FAILED"
    echo "$GET_CONVOS"
fi
echo ""

# Test 12: Create group
echo "[12] Testing POST /groups"
CREATE_GROUP=$(curl -s -X POST "$BASE_URL/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"API Test Group","description":"Group for testing","type":"private"}')

if echo "$CREATE_GROUP" | grep -q '"id"'; then
    echo "✓ Create group SUCCESS"
else
    echo "✗ Create group FAILED"
    echo "$CREATE_GROUP"
fi
echo ""

# Test 13: Get groups
echo "[13] Testing GET /groups"
GET_GROUPS_ALL=$(curl -s -X GET "$BASE_URL/groups" \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_GROUPS_ALL" | grep -q '"items"'; then
    echo "✓ Get groups SUCCESS"
else
    echo "✗ Get groups FAILED"
    echo "$GET_GROUPS_ALL"
fi
echo ""

# Test 14: Get channels
echo "[14] Testing GET /channels/my"
GET_MY_CHANNELS=$(curl -s -X GET "$BASE_URL/channels/my" \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_MY_CHANNELS" | grep -q '"items"' || echo "$GET_MY_CHANNELS" | grep -q '\[\]'; then
    echo "✓ Get my channels SUCCESS"
else
    echo "✗ Get my channels FAILED"
    echo "$GET_MY_CHANNELS"
fi
echo ""

echo "========================================="
echo "Testing Complete!"
echo "========================================="
echo "Backend: $BASE_URL"
echo "Workspace ID: ${WORKSPACE_ID:-Not created}"
