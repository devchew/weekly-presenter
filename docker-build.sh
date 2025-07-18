#!/bin/bash

# Build the Docker image
echo "Building Docker image..."
docker build -t team-scheduler .

# Run the container
echo "Starting container..."
docker run -p 3001:3001 -v $(pwd)/data:/app/data team-scheduler
