#!/usr/bin/env bash
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install --include=dev

echo "Building frontend..."
npm run build

echo "Installing backend dependencies..."
cd ../backend
npm install --include=dev

echo "Building backend..."
npm run build

echo "Build complete!"
