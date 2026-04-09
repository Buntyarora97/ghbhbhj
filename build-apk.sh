#!/bin/bash

cd /home/runner/workspace/artifacts/mobile
echo "=== Directory: $(pwd) ==="

LOGGED_IN=$(npx eas-cli@latest whoami 2>/dev/null || echo "")
if [ -z "$LOGGED_IN" ]; then
  echo "=== Please login to Expo ==="
  npx eas-cli@latest login
fi

echo "=== Logged in as: $(npx eas-cli@latest whoami) ==="
echo "=== Starting APK Build ==="
EAS_BUILD_NO_EXPO_GO_WARNING=true npx eas-cli@latest build --platform android --profile production
