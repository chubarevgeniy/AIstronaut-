#!/bin/bash

# Ensure the config directory exists
mkdir -p ~/.config/godot/

# Resolve absolute path to keystore
# Using workspace path now as generated in workflow
KEYSTORE_PATH="$GITHUB_WORKSPACE/godot_project/debug.keystore"

# Resolve JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    JAVA_BIN=$(readlink -f $(which java))
    JAVA_HOME_PATH=$(dirname $(dirname $JAVA_BIN))
else
    JAVA_HOME_PATH="$JAVA_HOME"
fi

# Resolve ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    echo "WARNING: ANDROID_HOME not set. Using default location /usr/lib/android-sdk"
    ANDROID_HOME_PATH="/usr/lib/android-sdk"
else
    ANDROID_HOME_PATH="$ANDROID_HOME"
fi

echo "Generating Editor Settings with keystore at: $KEYSTORE_PATH"
echo "Using JAVA_HOME: $JAVA_HOME_PATH"
echo "Using ANDROID_HOME: $ANDROID_HOME_PATH"

# Generate the editor settings file
cat <<EOF > ~/.config/godot/editor_settings-4.tres
[gd_resource type="EditorSettings" format=3]

[resource]
export/android/android_sdk_path = "$ANDROID_HOME_PATH"
export/android/java_sdk_path = "$JAVA_HOME_PATH"
export/android/debug_keystore = "$KEYSTORE_PATH"
export/android/debug_keystore_user = "androiddebugkey"
export/android/debug_keystore_pass = "android"
export/android/force_system_user = false
export/android/shutdown_on_exit = true
EOF

echo "Generated ~/.config/godot/editor_settings-4.tres"
cat ~/.config/godot/editor_settings-4.tres
