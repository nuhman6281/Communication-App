#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"

# Register and get token
echo "Registering new user..."
TIMESTAMP=$(date +%s)
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"debug${TIMESTAMP}@example.com\",\"username\":\"debug${TIMESTAMP}\",\"password\":\"Test123!\",\"firstName\":\"Debug\",\"lastName\":\"User\"}")

echo "Registration response:"
echo "$REGISTER"
echo ""

VERIFICATION_TOKEN=$(echo "$REGISTER" | grep -o '"verificationToken":"[^"]*' | sed 's/"verificationToken":"//')
echo "Verification token: $VERIFICATION_TOKEN"

# Verify email
echo "Verifying email..."
curl -s -X POST "$BASE_URL/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$VERIFICATION_TOKEN\"}" > /dev/null

# Login
echo "Logging in..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"debug${TIMESTAMP}@example.com\",\"password\":\"Test123!\"}")

TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
echo "Token received: ${TOKEN:0:50}..."

# Create workspace
echo ""
echo "Creating workspace..."
RESULT=$(curl -s -X POST "$BASE_URL/workspaces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Debug Workspace","slug":"debug-ws","description":"Testing"}')

echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
