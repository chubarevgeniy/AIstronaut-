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
# Find all apksigners
find $ANDROID_HOME/build-tools -name apksigner -ls

echo "=== KEYSTORE ==="
# Check the keystore in the project directory (new location)
KEYSTORE_PATH="godot_project/debug.keystore"
if [ -f "$KEYSTORE_PATH" ]; then
    echo "Found keystore at: $KEYSTORE_PATH"
    ls -l $KEYSTORE_PATH
    # Check keystore validity (requires password)
    keytool -list -v -keystore $KEYSTORE_PATH -storepass android || echo "Keystore verification failed!"
else
    echo "ERROR: Keystore not found at $KEYSTORE_PATH"
    ls -R godot_project | grep keystore || echo "No keystore found in godot_project"
fi

echo "=== EDITOR SETTINGS ==="
cat ~/.config/godot/editor_settings-4.tres

echo "=== END DIAGNOSTICS ==="
