from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "src" / "actuator_online_test.cpp").read_text()
platformio = (root / "platformio.ini").read_text()

assert "[env:actuator-online-test]" in platformio
assert "build_src_filter = +<actuator_online_test.cpp>" in platformio
assert "firebase_config.local.h" in source
assert "WebServer" in source
assert 'server.on("/api/all-off"' in source
assert 'server.on("/api/channel"' in source
assert "TEST_ON_MAX_MS" in source
assert "allOff();" in source
assert "WiFi.status() != WL_CONNECTED" in source
assert "only one channel may be ON" in source
print("PASS: online actuator test has isolated build, safe-off controls, and timeout")
