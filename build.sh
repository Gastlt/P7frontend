#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

# ============================================================================
# P7 Frontend Build & Push to OCIR
# Usage:
#   ./build.sh [--region REGION] [--namespace NAMESPACE] [--repo REPO] \
#               [--tag TAG] [--backend-url URL] [--skip-push]
# 
# Environment variables (if args not provided):
#   OCIR_REGION, OCIR_NAMESPACE, OCIR_REPO, OCIR_TAG, BACKEND_PUBLIC_URL, BACKEND_INTERNAL_URL, SKIP_PUSH
# ============================================================================

# Defaults
OCIR_REGION="${OCIR_REGION:-mx-queretaro-1}"
OCIR_NAMESPACE="${OCIR_NAMESPACE:-}"
OCIR_REPO="${OCIR_REPO:-equipo52/yv0fi/p7frontend}"
OCIR_TAG="${OCIR_TAG:-latest}"
BACKEND_PUBLIC_URL="${BACKEND_PUBLIC_URL:-http://localhost:8080/api}"
BACKEND_INTERNAL_URL="${BACKEND_INTERNAL_URL:-http://todolistapp-backend-router.mtdrworkshop.svc.cluster.local}"
SKIP_PUSH="${SKIP_PUSH:-false}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-}"
DOCKER_MEMORY="${DOCKER_MEMORY:-512m}"
DOCKER_CPUS="${DOCKER_CPUS:-1}"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      OCIR_REGION="$2"
      shift 2
      ;;
    --namespace)
      OCIR_NAMESPACE="$2"
      shift 2
      ;;
    --repo)
      OCIR_REPO="$2"
      shift 2
      ;;
    --tag)
      OCIR_TAG="$2"
      shift 2
      ;;
    --backend-url)
      BACKEND_PUBLIC_URL="$2"
      shift 2
      ;;
    --backend-internal-url)
      BACKEND_INTERNAL_URL="$2"
      shift 2
      ;;
    --skip-push)
      SKIP_PUSH="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Validate required inputs
if [[ -z "$OCIR_NAMESPACE" ]]; then
  echo "ERROR: OCIR_NAMESPACE is required (use --namespace or set OCIR_NAMESPACE env var)"
  exit 1
fi

# Construct image name and registry URL
OCIR_REGISTRY="${OCIR_REGION}.ocir.io"
IMAGE_FULL="${OCIR_REGISTRY}/${OCIR_NAMESPACE}/${OCIR_REPO}:${OCIR_TAG}"
CONTAINER_NAME="p7frontend"

echo "=========================================="
echo "P7 Frontend Build & Push to OCIR"
echo "=========================================="
echo "Registry:    $OCIR_REGISTRY"
echo "Image:       $IMAGE_FULL"
echo "Backend URL: $BACKEND_PUBLIC_URL"
echo "Backend internal URL: $BACKEND_INTERNAL_URL"
echo "Skip Push:   $SKIP_PUSH"
echo "=========================================="

# Cleanup previous local containers/images
echo "[1/3] Cleaning up previous versions..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
docker rmi "$IMAGE_FULL" 2>/dev/null || true

# Build image
echo "[2/3] Building Docker image..."
build_args=(
  --build-arg "NEXT_PUBLIC_API_URL=$BACKEND_PUBLIC_URL"
  --build-arg "BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL"
  --build-arg "NODE_ENV=production"
)

if [[ -n "$DOCKER_PLATFORM" ]]; then
  build_args+=(--platform "$DOCKER_PLATFORM")
fi

docker build "${build_args[@]}" -t "$IMAGE_FULL" .

if [[ "$SKIP_PUSH" != "true" ]]; then
  # Push to OCIR (assumes docker login already done)
  echo "[3/3] Pushing to OCIR..."
  docker push "$IMAGE_FULL"
else
  echo "[3/3] Skipping push (SKIP_PUSH=true)"
fi

echo ""
echo "Image built successfully: $IMAGE_FULL"
if [[ "$SKIP_PUSH" != "true" ]]; then
  echo "Pushed to: $OCIR_REGISTRY"
fi
