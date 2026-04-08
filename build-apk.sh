#!/bin/bash
set -e

echo "=== Moving to mobile directory ==="
cd /home/runner/workspace/artifacts/mobile

echo "=== Current directory: $(pwd) ==="

echo "=== Checking login ==="
npx eas-cli@latest whoami

echo "=== Starting APK Build ==="
EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli@latest build --platform android --profile production
