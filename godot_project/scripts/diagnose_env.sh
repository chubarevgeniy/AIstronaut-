#!/bin/bash
set -e

echo "=== DIAGNOSTICS START ==="
echo "ANDROID_HOME: $ANDROID_HOME"
echo "--- build-tools ---"
ls -la $ANDROID_HOME/build-tools
echo "--- platform-tools ---"
ls -la $ANDROID_HOME/platform-tools
echo "--- platforms ---"
ls -la $ANDROID_HOME/platforms

echo "=== JAVA ==="
which java
java -version
echo "JAVA_HOME (env): $JAVA_HOME"
# Find java home dynamically
JAVA_BIN=$(readlink -f $(which java))
JAVA_HOME_DETECTED=$(dirname $(dirname $JAVA_BIN))
echo "JAVA_HOME (detected): $JAVA_HOME_DETECTED"

echo "=== GODOT EXPORT TEMPLATES ==="
ls -laR ~/.local/share/godot/export_templates/

echo "=== KEYSTORE ==="
ls -la ~/.android/debug.keystore

echo "=== EDITOR SETTINGS ==="
cat ~/.config/godot/editor_settings-4.tres

echo "=== END DIAGNOSTICS ==="
