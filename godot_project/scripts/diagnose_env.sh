#!/bin/bash
set -e

echo "=== DIAGNOSTICS START ==="
echo "ANDROID_HOME: $ANDROID_HOME"
ls -la $ANDROID_HOME
echo "--- build-tools ---"
ls -la $ANDROID_HOME/build-tools
echo "--- cmdline-tools ---"
ls -la $ANDROID_HOME/cmdline-tools
echo "--- platform-tools ---"
ls -la $ANDROID_HOME/platform-tools

echo "=== JAVA_HOME ==="
echo "JAVA_HOME: $JAVA_HOME"
ls -la $JAVA_HOME

echo "=== GODOT EXPORT TEMPLATES ==="
ls -laR ~/.local/share/godot/export_templates/

echo "=== KEYSTORE ==="
ls -la ~/.android/debug.keystore

echo "=== EDITOR SETTINGS ==="
cat ~/.config/godot/editor_settings-4.tres

echo "=== END DIAGNOSTICS ==="
