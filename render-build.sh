# Build commands for Render deployment
# Build command: ./render-build.sh
# Start command: npm run start

#!/usr/bin/env bash
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Installing backend dependencies..."
cd ../backend
npm install

echo "Building backend..."
npm run build

echo "Build complete!"
