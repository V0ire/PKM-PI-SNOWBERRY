#!/usr/bin/env bash
# Uji logika kontrol & builder JSON di host (tanpa hardware ESP32).
set -e
cd "$(dirname "$0")/.."
CXX=${CXX:-g++}
FLAGS="-std=c++17 -I include -I test/stub -Wall -Wextra"
echo "== control logic =="
$CXX $FLAGS test/test_control.cpp src/control.cpp src/types.cpp src/actuators.cpp -o /tmp/snowberry_test
/tmp/snowberry_test
echo
echo "== status json =="
$CXX $FLAGS test/test_json.cpp src/status_json.cpp src/control.cpp src/types.cpp src/actuators.cpp -o /tmp/snowberry_json
/tmp/snowberry_json
