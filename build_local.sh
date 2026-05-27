#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

# Configuration - LOCAL DEPLOYMENT ONLY
# This script is for local Docker testing and development
# For OCIR push, use ./build.sh instead

container_name="p7frontend"
image_name="p7frontend:1.1"
backend_url="${BACKEND_URL:-http://localhost:8080/api}"
docker_platform="${DOCKER_PLATFORM:-}"
docker_memory="${DOCKER_MEMORY:-512m}"
docker_cpus="${DOCKER_CPUS:-1}"

echo "Building P7 Frontend (LOCAL)..."
echo "   Image: $image_name"
echo "   Container: $container_name"
echo "   Backend URL: $backend_url"

echo "Cleaning up previous versions..."
docker stop "$container_name" 2>/dev/null || true
docker rm -f "$container_name" 2>/dev/null || true
docker rmi "$image_name" 2>/dev/null || true

echo "Building Docker image..."
build_args=(--build-arg "NEXT_PUBLIC_API_URL=$backend_url" --build-arg "NODE_ENV=production")

if [[ -n "$docker_platform" ]]; then
	build_args+=(--platform "$docker_platform")
fi

docker build -f Dockerfile "${build_args[@]}" -t "$image_name" .

echo "Starting container..."
run_args=(--name "$container_name" \
	--memory "$docker_memory" \
	--cpus "$docker_cpus" \
	-p 3000:3000 \
	--network bridge)

docker run "${run_args[@]}" -d "$image_name"

echo "Frontend started successfully!"
echo "   Access at: http://localhost:3000"
echo "   Backend API: $backend_url"
echo "   Logs: docker logs -f $container_name"
