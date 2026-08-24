from pathlib import Path

root = Path(__file__).resolve().parents[1]
ini = (root / "platformio.ini").read_text()
main = (root / "src/main.cpp").read_text()
network = (root / "src/network_worker.cpp").read_text()
firebase = (root / "src/firebase_sync.cpp").read_text()
measurement = (root / "src/measurement_server.cpp").read_text()
manual = (root / "src/manual_control.cpp").read_text()
types = (root / "include/types.h").read_text()

assert "[env:actuator-test]" not in ini
assert "[env:actuator-online-test]" not in ini
assert not (root / "src/actuator_test.cpp").exists()
assert not (root / "src/actuator_online_test.cpp").exists()
assert "pollCommand" not in main
assert "WiFiClientSecure" not in main and "HTTPClient" not in main
assert "xTaskCreatePinnedToCore" in network
assert '"snowberry-network", 8192, nullptr, 0' in network
assert "xQueueCreate" in network
assert "if (!g_thresholdQueue || !g_statusQueue) return;" in network
assert "== pdPASS" in network
assert network.index("fbsync::begin") < network.index("for (;;)")
assert "fetchThresholds" in network
assert "pollCommand" not in network
assert "pollCommand" not in firebase
assert "xQueueCreate" in manual and "ManualTarget::UNKNOWN" in manual
assert "manual_control::take" in main
assert "soil_adc_dry" not in firebase and "soil_adc_wet" not in firebase
assert "SNOWBERRY_MEASUREMENT_MODE" in main
measurement_env = ini[ini.index("[env:measurement]") : ini.index("[env:gpio17-test]")]
assert "-<firebase_sync.cpp>" in measurement_env and "-<network_worker.cpp>" in measurement_env
setup = main[main.index("void setup()") : main.index("void loop()")]
measurement_branch = setup[setup.index("#ifdef SNOWBERRY_MEASUREMENT_MODE"):]
assert measurement_branch.index("measurement::begin") < measurement_branch.index("#else")
assert "fbsync::begin" not in measurement_branch[:measurement_branch.index("#else")]
assert "while (digitalRead" not in main
assert "g_calibration.cancel()" in main
assert "rh_sample_ms" in types and "lux_sample_ms" in types and "soil_sample_ms" in types
assert "esp_reset_reason" in main and "g_bootCount" in main
assert "g_maxLoopLatency" in main and "g_deadlineOverruns" in main
assert "wifiConnected" in main and "ipAddress" in main and "g_time.synced" in main
assert "[sensor]" in main and "temperature_c=" in main and "soil_raw_adc=" in main
assert "[gpio]" in main and "GPIO16" in main and "GPIO25" in main and "GPIO32" in main
assert "commanded=" in main and "level=" in main
assert "[control]" in main and "active_fault=" in main
assert "wifiDisconnectReason" in main and "wifiDisconnectReasonName" in main
assert "ARDUINO_EVENT_WIFI_STA_DISCONNECTED" in network
assert "NO_AP_FOUND" in network and "AUTH_FAIL" in network
assert "nullValue" in firebase
print("PASS: firmware architecture safety checks")