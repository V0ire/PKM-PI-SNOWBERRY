from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "src" / "gpio17_test.cpp").read_text()
ini = (root / "platformio.ini").read_text()

assert "[env:gpio17-test]" in ini
assert "build_src_filter = +<gpio17_test.cpp>" in ini
esp32dev = ini[ini.index("[env:esp32dev]") : ini.index("[env:measurement]")]
assert "-<actuator_test.cpp>" in esp32dev
assert "-<actuator_online_test.cpp>" in esp32dev
assert "-<gpio17_test.cpp>" in esp32dev
assert "digitalWrite(17, LOW);" in source
assert source.index("digitalWrite(17, LOW);") < source.index("pinMode(17, OUTPUT);")
loop = source[source.index("void loop()") :]
assert loop.index("digitalWrite(17, HIGH);") < loop.index("digitalWrite(17, LOW);")
assert loop.count("delay(2000);") == 2
print("PASS: GPIO17 starts safe and loops HIGH/LOW every 2 seconds")
