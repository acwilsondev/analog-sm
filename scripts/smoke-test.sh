#!/bin/bash
set -e

echo "🚀 Starting Analog SM Smoke Test..."

# 1. Start Services
echo "📦 Building and starting containers..."
docker-compose down -v > /dev/null 2>&1
docker-compose up -d --build > /dev/null 2>&1

# 2. Wait for Readiness
echo "⏳ Waiting for services to be ready..."
RETRIES=30
until docker-compose exec -T postgres pg_isready -U user -d analogdb > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  sleep 2
  RETRIES=$((RETRIES-1))
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Error: PostgreSQL failed to start in time."
  exit 1
fi

# 3. Initialize DB
echo "🛠 Initializing database schema..."
docker-compose exec -T -u root app ./node_modules/.bin/prisma db push --accept-data-loss > /dev/null 2>&1

# 4. Seed DB
echo "🌱 Seeding database..."
docker-compose exec -T -u root app npx prisma@5.22.0 db seed > /dev/null 2>&1

# 5. Verify Web App
echo "🔍 Verifying Web Application..."
# Check root - following redirects
STATUS_CODE=$(curl -s -L -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$STATUS_CODE" -eq 200 ]; then
  echo "✅ Success: Web app (or login redirect) returned HTTP 200."
  
  # Check for core UI elements (should find them on login page if redirected)
  HTML=$(curl -s -L http://localhost:3000)
  if echo "$HTML" | grep -q "Analog SM"; then
    echo "✅ Success: Brand name found in HTML."
  else
    echo "❌ Error: Brand name missing from home/login page."
    exit 1
  fi

  # Specifically check for login page if redirected
  if echo "$HTML" | grep -q "Sign in"; then
    echo "ℹ️ Note: Redirected to login page as expected."
  fi

  # Check Search Route
  SEARCH_CODE=$(curl -s -L -o /dev/null -w "%{http_code}" http://localhost:3000/search)
  if [ "$SEARCH_CODE" -eq 200 ]; then
    echo "✅ Success: Search page (or login redirect) returned HTTP 200."
  else
    echo "❌ Error: Search page returned HTTP $SEARCH_CODE."
    exit 1
  fi

  # Check Profile Route
  PROFILE_CODE=$(curl -s -L -o /dev/null -w "%{http_code}" http://localhost:3000/profile/alice)
  if [ "$PROFILE_CODE" -eq 200 ]; then
    echo "✅ Success: Alice's profile (or login redirect) returned HTTP 200."
  else
    echo "❌ Error: Profile page returned HTTP $PROFILE_CODE."
    exit 1
  fi

  # Check Friends Route
  FRIENDS_CODE=$(curl -s -L -o /dev/null -w "%{http_code}" http://localhost:3000/friends)
  if [ "$FRIENDS_CODE" -eq 200 ]; then
    echo "✅ Success: Friends page (or login redirect) returned HTTP 200."
  else
    echo "❌ Error: Friends page returned HTTP $FRIENDS_CODE."
    exit 1
  fi
else
  echo "❌ Error: Web app returned HTTP $STATUS_CODE."
  exit 1
fi

echo "🎉 Smoke test passed successfully!"
