#!/usr/bin/env bash
set -euo pipefail

# Fast package mode: do not install/build, only package existing standalone output.
# Run this on Linux only after a successful build already exists.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "Packaging from existing build artifacts..."
bash "$PROJECT_ROOT/package-linux.sh" --skip-install --skip-build
