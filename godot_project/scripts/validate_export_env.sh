#!/bin/bash
set -e

if [ ! -f "godot_project/debug.keystore" ]; then
  echo "Error: godot_project/debug.keystore not found!"
  exit 1
fi

ANDROID_SDK="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [ -z "$ANDROID_SDK" ]; then
  echo "Error: ANDROID_SDK_ROOT or ANDROID_HOME not set."
  exit 1
fi

if [ ! -d "$ANDROID_SDK" ]; then
  echo "Error: Android SDK directory '$ANDROID_SDK' does not exist."
  exit 1
fi

echo "Environment validation passed."
