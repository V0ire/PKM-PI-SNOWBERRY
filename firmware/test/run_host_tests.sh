#!/usr/bin/env bash
# Uji logika kontrol & builder JSON di host (tanpa hardware ESP32).
set -euo pipefail
cd "$(dirname "$0")/.."
CXX=${CXX:-g++}
FLAGS="-std=c++17 -I include -I test/stub -Wall -Wextra -Werror -fsanitize=address,undefined -fno-omit-frame-pointer"
echo "== control logic =="
$CXX $FLAGS test/test_control.cpp src/control.cpp src/types.cpp src/actuators.cpp -o /tmp/snowberry_test
/tmp/snowberry_test
echo "== sensor safety =="
$CXX $FLAGS test/test_sensor_safety.cpp src/sensor_safety.cpp -o /tmp/snowberry_sensor
/tmp/snowberry_sensor
echo "== calibration state machine =="
$CXX $FLAGS test/test_calibration.cpp src/calibration.cpp -o /tmp/snowberry_calibration
/tmp/snowberry_calibration
echo
echo "== status json =="
$CXX $FLAGS test/test_json.cpp src/status_json.cpp src/control.cpp src/types.cpp src/actuators.cpp -o /tmp/snowberry_json
/tmp/snowberry_json
python test/check_architecture.py
python test/check_gpio17_test.py
python test/check_i2c_scanner.py
