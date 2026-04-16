#!/bin/sh
set -e

echo "Waiting for postgres to be ready..."
until node -e "const net = require('net'); const client = net.createConnection({ port: 5432, host: 'postgres' }, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1));" > /dev/null 2>&1; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Running database migrations..."
./node_modules/.bin/prisma db push --accept-data-loss

echo "Starting application..."
exec node server.js
