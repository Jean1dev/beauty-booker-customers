#!/usr/bin/env bash
set -euo pipefail
ADB="${ANDROID_HOME:-$HOME/Android/sdk}/platform-tools/adb"
MAX_WAIT_SEC="${WAIT_ANDROID_BOOT_SEC:-900}"
elapsed=0
SERIAL="${ANDROID_SERIAL:-}"

pick_emulator_serial() {
  "$ADB" devices 2>/dev/null | awk '/^emulator-[0-9]+/ {print $1; exit}'
}

if [[ -z "$SERIAL" ]]; then
  SERIAL="$(pick_emulator_serial || true)"
fi

if [[ -z "$SERIAL" ]]; then
  echo "Nenhum emulador listado em adb devices. Suba o AVD (ex.: npm run android:emu)." >&2
  exit 1
fi

while (( elapsed < MAX_WAIT_SEC )); do
  state="$("$ADB" devices 2>/dev/null | awk -v s="$SERIAL" '$1==s {print $2}')"
  if [[ "$state" == "offline" ]]; then
    "$ADB" reconnect 2>/dev/null || true
    sleep 2
  fi
  if "$ADB" -s "$SERIAL" shell getprop ro.product.cpu.abilist >/dev/null 2>&1; then
    boot="$("$ADB" -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
    if [[ "$boot" == "1" ]]; then
      exit 0
    fi
  fi
  sleep 3
  elapsed=$((elapsed + 3))
done

echo "Timeout aguardando emulador ${SERIAL} (adb device/offline ou boot incompleto)." >&2
exit 1
