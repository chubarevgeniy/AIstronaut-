#!/bin/bash

# Ensure the config directory exists
mkdir -p ~/.config/godot/

# Generate the editor settings file
cat <<EOF > ~/.config/godot/editor_settings-4.tres
[gd_resource type="EditorSettings" format=3]

[resource]
export/android/android_sdk_path = "/usr/lib/android-sdk"
export/android/debug_keystore = "$GITHUB_WORKSPACE/godot_project/debug.keystore"
export/android/debug_keystore_user = "androiddebugkey"
export/android/debug_keystore_pass = "android"
export/android/force_system_user = false
export/android/shutdown_on_exit = true
EOF

echo "Generated ~/.config/godot/editor_settings-4.tres"
cat ~/.config/godot/editor_settings-4.tres
