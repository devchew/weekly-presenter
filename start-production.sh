#!/bin/bash

echo "Starting Team Scheduler in production mode..."

export NODE_ENV=production
export DATABASE_PATH=./data/database.sqlite
export PORT=3001

echo "Building application..."
npm run build

echo "Starting server..."
node server/index.js
