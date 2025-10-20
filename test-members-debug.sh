#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

# Register and get token
TIMESTAMP=$(date +%s)
echo "Registering user..."
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"members${TIMESTAMP}@example.com\",\"username\":\"members${TIMESTAMP}\",\"password\":\"Test123!\",\"firstName\":\"Members\",\"lastName\":\"Test\"}")

VERIFICATION_TOKEN=$(echo "$REGISTER" | grep -o '"verificationToken":"[^"]*' | sed 's/"verificationToken":"//')

# Verify email
curl -s -X POST "$BASE_URL/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$VERIFICATION_TOKEN\"}" > /dev/null

# Login
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"members${TIMESTAMP}@example.com\",\"password\":\"Test123!\"}")

TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
echo "Logged in, token: ${TOKEN:0:30}..."

# Create workspace
echo "Creating workspace..."
CREATE_WS=$(curl -s -X POST "$BASE_URL/workspaces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Members Test WS\",\"slug\":\"members-test-${TIMESTAMP}\",\"description\":\"Testing members\"}")

WORKSPACE_ID=$(echo "$CREATE_WS" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "Workspace created: $WORKSPACE_ID"
echo ""

# Test getting members
echo "Testing GET /workspaces/$WORKSPACE_ID/members"
curl -v -X GET "$BASE_URL/workspaces/$WORKSPACE_ID/members" \
  -H "Authorization: Bearer $TOKEN" 2>&1
