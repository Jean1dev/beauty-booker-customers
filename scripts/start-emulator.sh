#!/usr/bin/env bash
set -euo pipefail
ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/sdk}"
EMULATOR="$ANDROID_HOME/emulator/emulator"
AVD_NAME="${1:-Expo_API_35}"
if [[ -r /dev/kvm ]]; then
  echo "Starting emulator with KVM acceleration"
  exec "$EMULATOR" "@$AVD_NAME" "${@:2}"
else
  exec "$EMULATOR" "@$AVD_NAME" -accel off -gpu swiftshader_indirect "${@:2}"
fi
