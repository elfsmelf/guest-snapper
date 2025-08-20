#!/bin/bash

# Script to clean up the elfsmelf@gmail.com user via the admin API
# This uses Better Auth's official admin.removeUser method

echo "🧹 Starting cleanup for elfsmelf@gmail.com..."

# You need to get an admin session cookie first
# Visit http://localhost:3000/admin in your browser as an admin user, then copy the cookie

read -p "Please paste your admin session cookie (from browser dev tools): " COOKIE

if [ -z "$COOKIE" ]; then
    echo "❌ No cookie provided. Please get the session cookie from your browser."
    echo "1. Go to http://localhost:3000/admin"
    echo "2. Open browser dev tools (F12)"
    echo "3. Go to Application/Storage tab"
    echo "4. Copy the session cookie value"
    exit 1
fi

echo "📡 Calling cleanup API..."

curl -X POST http://localhost:3000/api/admin/cleanup-user \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"email": "elfsmelf@gmail.com"}' \
  | jq .

echo "✅ Cleanup script completed!"