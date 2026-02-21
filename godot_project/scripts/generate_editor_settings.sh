#!/bin/bash
set -e

# Arguments
KEYSTORE_PATH="$1"
KEYSTORE_USER="$2"
KEYSTORE_PASS="$3"

# Find Android SDK
ANDROID_SDK="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [ -z "$ANDROID_SDK" ]; then
  echo "Error: ANDROID_SDK_ROOT or ANDROID_HOME not set."
  exit 1
fi

echo "Found Android SDK at: $ANDROID_SDK"

# Ensure directory exists
mkdir -p ~/.config/godot/

# Write EditorSettings
# Use cat with heredoc to overwrite the file
cat > ~/.config/godot/editor_settings-4.tres <<EOF
[gd_resource type="EditorSettings" format=3]

[resource]
export/android/android_sdk_path = "$ANDROID_SDK"
export/android/debug_keystore = "$KEYSTORE_PATH"
export/android/debug_keystore_user = "$KEYSTORE_USER"
export/android/debug_keystore_pass = "$KEYSTORE_PASS"
export/android/force_system_user = false
export/android/shutdown_adb_on_exit = true
EOF

echo "Generated ~/.config/godot/editor_settings-4.tres"
