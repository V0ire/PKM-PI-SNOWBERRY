#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo "  Snowberry configurable source tests    "
echo "========================================="

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

g++ -std=c++17 -I. -I../include \
  test_configurable.cpp \
  storage_stub.cpp \
  ../src/actuators.cpp \
  ../src/calibration.cpp \
  ../src/control.cpp \
  ../src/status_json.cpp \
  ../src/types.cpp \
  -o test_configurable

./test_configurable
rm -f test_configurable

echo "========================================="
echo "  All production tests completed OK      "
echo "========================================="
