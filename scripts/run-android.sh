#!/usr/bin/env bash
set -euo pipefail
export JAVA_TOOL_OPTIONS="--enable-native-access=ALL-UNNAMED${JAVA_TOOL_OPTIONS:+ ${JAVA_TOOL_OPTIONS}}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bash "$ROOT/scripts/wait-for-emulator-ready.sh"
exec npx expo run:android "$@"
