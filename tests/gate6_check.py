#!/usr/bin/env python3
"""Static Gate 6 security/transport contract check. No Firebase deployment."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SYNC = ROOT / "firmware/src/firebase_sync.cpp"
RULES = ROOT / "firebase/firestore.rules"
HEADER = ROOT / "firmware/include/firebase_sync.h"


def require(text: str, token: str, where: str) -> None:
    assert token in text, f"{where}: missing {token!r}"


def main() -> None:
    assert SYNC.exists(), "firmware/src/firebase_sync.cpp missing"
    sync = SYNC.read_text()
    rules = RULES.read_text()
    header = HEADER.read_text()

    for token in ("WiFi.h", "HTTPClient.h", "Preferences.h", "ArduinoJson.h",
                  "xTaskCreatePinnedToCore", "setConnectTimeout", "setTimeout",
                  "securetoken.googleapis.com", "accounts:signInWithPassword",
                  "refresh_token", "expiresIn", "last_command_id", "TELEMETRY_CAPACITY"):
        require(sync, token, "firebase_sync.cpp")
    for field in ("config_id", "soil_low", "soil_high", "rh_low", "rh_high",
                  "temperature_influence", "temp_low", "temp_high",
                  "humidifier_priority", "temperature_failure_fallback", "lux_low",
                  "lux_high", "light_schedule_enabled", "light_schedule_start_hour",
                  "light_schedule_end_hour", "pump_pulse_ms", "soak_period_ms",
                  "pump_start_limit", "pump_window_ms", "planting_date", "updated_at",
                  "updated_by"):
        require(sync, f'"{field}"', "full config parser")
    for field in ("command_id", "actuator", "mode", "state", "manual_until",
                  "issued_at", "issued_by"):
        require(sync, f'"{field}"', "command parser")
    for actuator in ("growlight", "pump", "humidifier"):
        require(sync, f'"{actuator}"', "command actuator parser")
    for ack in ("APPLIED", "REJECTED_SAFETY", "EXPIRED", "INVALID"):
        require(header + sync, ack, "ack contract")

    require(rules, "allow read, write: if false", "default deny")
    require(rules, "owner_uid", "owner identity")
    require(rules, "device_uid", "device identity")
    assert "allow read, write: if true" not in rules, "public rule remains"
    for forbidden in ("soil_adc_dry", "soil_adc_wet", "gpio", "polarity"):
        require(rules, forbidden, "forbidden cloud field guard")
    assert re.search(r"match /config/thresholds", rules)
    assert re.search(r"match /config/commands", rules)
    assert re.search(r"match /status/realtime", rules)
    assert re.search(r"match /telemetry/\{date\}", rules)
    print("Gate 6 static contract checks passed")


if __name__ == "__main__":
    main()
