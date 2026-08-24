from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "src" / "i2c-sensor-scanner.cpp").read_text()
ini = (root / "platformio.ini").read_text()

assert "[env:i2c-sensor-scanner]" in ini
assert "-<i2c-sensor-scanner.cpp>" in ini
assert "Scan #" in source and "duration=" in source
assert "Expected BH1750" in source and "Expected SHT30" in source
assert "FOUND" in source and "MISSING" in source
assert "SDA level=" in source and "SCL level=" in source
assert "Check 3.3V, GND, SDA, SCL" in source
assert "Normal for an unused address" in source and "NACK on data" in source and "Other I2C error" in source
assert source.index("keepActuatorsOff();") < source.index("Wire.begin(")
print("PASS: informative I2C scanner diagnostics and safe isolation")
