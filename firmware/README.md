# Snowberry Rev B isolated firmware

`PASS WITH REQUIRED PHYSICAL TESTS` is the highest software-only result.

This project is isolated from `snowberry-history-4fe5c3a`. Do not copy it back or
connect actuator loads until the software commands and physical gates pass.

## Hardware contract

All outputs use `LOW=OFF`, `HIGH=ON` and are latched LOW before `pinMode(OUTPUT)`:

- GPIO16 Growlight
- GPIO25 Spare SSR, permanently OFF
- GPIO17 Pump
- GPIO18 Mist 1
- GPIO19 Fan 1
- GPIO23 Mist 2
- GPIO32 Fan 2

GPIO27 alternates every 500 ms from the local main loop. GPIO33 runs the
non-blocking local soil-calibration state machine. Local calibration defaults are
dry `3500`, wet `1500`; Firebase cannot replace them.

## Software gates

```bash
cd /home/caradhina/Project/snowberry-standalone-test
bash test/run_host_tests.sh
pio run -e esp32dev
pio run -e measurement
pio run -e gpio17-test
```

Only `esp32dev`, `measurement`, and explicitly isolated `gpio17-test` remain.
Upload production firmware with `pio run -e esp32dev -t upload` unless a test
environment was explicitly requested.

## Physical gates

1. Twenty cold boots.
2. Twenty EN resets.
3. No output glitches.
4. External 5 V-only boot.
5. Wi-Fi absent and wrong-password operation.
6. Internet, NTP, and Firebase failures while local control continues.
7. Manual pump runtime remains at or below 45 seconds.
8. Reboot does not restore pump budget.
9. Sensor disconnects force related outputs OFF.
10. All four humidifier channels switch together.
11. Two-hour headless run records heartbeat, heap, and loop latency.

Commanded GPIO state is not proof of relay, pump, fan, mist, or lamp operation.