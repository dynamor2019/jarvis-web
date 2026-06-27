#!/usr/bin/env bash
set -euo pipefail

# Fast package mode: do not install/build, only package existing standalone output.
# Run this on Linux only after a successful build already exists.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Packaging from existing build artifacts..."
bash "$PROJECT_ROOT/ops/packaging/package-linux.sh" --skip-install --skip-build
