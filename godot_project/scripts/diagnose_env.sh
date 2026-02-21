#!/bin/bash
set -e

echo "=== DIAGNOSTICS START ==="
echo "USER: $(whoami) (UID: $(id -u))"
echo "ANDROID_HOME: $ANDROID_HOME"
ls -ld $ANDROID_HOME
echo "--- build-tools ---"
ls -la $ANDROID_HOME/build-tools
echo "--- platform-tools ---"
ls -la $ANDROID_HOME/platform-tools
echo "--- platforms ---"
ls -la $ANDROID_HOME/platforms

echo "=== JAVA ==="
which java
java -version
# Use JAVA_HOME from env if set, otherwise detect
if [ -z "$JAVA_HOME" ]; then
    JAVA_BIN=$(readlink -f $(which java))
    JAVA_HOME_DETECTED=$(dirname $(dirname $JAVA_BIN))
else
    JAVA_HOME_DETECTED="$JAVA_HOME"
fi
echo "JAVA_HOME (detected): $JAVA_HOME_DETECTED"
echo "Jarsigner: $(which jarsigner)"
if [ -f "$JAVA_HOME_DETECTED/bin/jarsigner" ]; then
    echo "Found jarsigner at: $JAVA_HOME_DETECTED/bin/jarsigner"
else
    echo "WARNING: jarsigner not found in JAVA_HOME/bin"
fi

echo "=== APKSIGNER CHECK ==="
# Find apksigner in build-tools
APKSIGNER=$(find $ANDROID_HOME/build-tools -name apksigner | head -n 1)
if [ -n "$APKSIGNER" ]; then
    echo "Found apksigner at: $APKSIGNER"
    ls -l $APKSIGNER
else
    echo "WARNING: apksigner not found in build-tools!"
fi

echo "=== KEYSTORE ==="
ls -la ~/.android/debug.keystore
# Check keystore validity (requires password)
keytool -list -v -keystore ~/.android/debug.keystore -storepass android || echo "Keystore verification failed!"

echo "=== EDITOR SETTINGS ==="
cat ~/.config/godot/editor_settings-4.tres

echo "=== END DIAGNOSTICS ==="
