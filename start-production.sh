#!/bin/bash
export NODE_ENV=production
export PORT=${PORT:-5000}
echo "Starting production server on port $PORT..."
node dist/index.js
