# Snowberry Rev B Audit Packet Index

**Packet status:** Design audit candidate, not as-built approval.

## Primary files

Read in this order:

1. `FINAL_WIRING_REV_B.md` — proposed canonical Rev B electrical design.
2. `HARDWARE_FIRMWARE_CONTRACT.md` — exact behavior firmware must implement before final hardware is connected.
3. `PHYSICAL_VERIFICATION_RECORD.md` — measurements/photos/tests required to convert the design into an as-built record.
4. `INDEPENDENT_AI_AUDIT_PROMPT.md` — adversarial audit instructions.
5. `../../.hermes/plans/2026-07-24_135333-snowberry-two-day-final-build.md` — schedule and delivery gates, if available to the reviewer.

## Current implementation files to attach

- `../../firmware/include/config.h`
- `../../firmware/include/types.h`
- `../../firmware/include/actuators.h`
- `../../firmware/include/control.h`
- `../../firmware/include/firebase_sync.h`
- `../../firmware/src/actuators.cpp`
- `../../firmware/src/control.cpp`
- `../../firmware/src/main.cpp`
- `../../firmware/src/sensors.cpp`
- `../../firmware/src/firebase_sync.cpp`
- `../../firmware/src/actuator_test.cpp` if present locally
- `../../firmware/test/test_control.cpp`
- `../../firmware/test/test_boot.cpp` or equivalent if present
- `../../firebase/firestore.rules`
- `../../docs/03-technical/integration-contract.md`

## Legacy documents supplied only for contradiction detection

These describe Rev A and must not silently override Rev B:

- `../03-technical/wiring-schematic.md`
- `../03-technical/actuator-driver-wiring.md`
- `../05-hardware/01-system-architecture-safety.md`
- `../05-hardware/02-easyeda-schematic-guide.md`
- `../05-hardware/03-breadboard-bench-test.md`
- `../05-hardware/04-pcb-layout-rules.md`
- `../05-hardware/05-pcb-order-commissioning-checklist.md`

Known legacy conflicts:

- three mechanical outputs instead of five;
- active-LOW relay assumptions instead of Rev B active-HIGH;
- GPIO4 calibration button despite strapping risk;
- shared three-adapter topology instead of six separate DC adapters;
- GPIO35 PSU-fault claim that cannot diagnose five isolated actuator supplies;
- one mist/fan pair instead of two paired assemblies;
- temperature-driven fan/mist logic rather than approved RH-only combined logic.

## Photos/evidence the reviewer still needs

Attach clear front/back photos of:

1. Fixed active-HIGH pump relay module.
2. Both two-channel selectable HIGH/LOW trigger relay modules, photographed separately.
3. Two-channel SSR module.
4. Relay/SSR header labels and trigger-selector positions.
5. Relay part numbers and contact ratings.
6. Six adapter labels and barrel connectors.
7. Pump, both mist makers, both fans, and growlights labels/connectors.
8. Matrix board before and after soldering.
9. Proposed relay tray and AC partition.
10. Controller/adapter-box mounting location and cable paths.

## Measurement files/evidence

Provide completed values from `PHYSICAL_VERIFICATION_RECORD.md`, especially:

- clean 0/3.3 V switching on all channels;
- all-relays-on logic current and 5 V sag;
- load normal/start current;
- fuse/wire/connector selection;
- soil AOUT maximum;
- effective I²C pullup resistance;
- SSR temperature at actual load;
- 20 boot/reset cycles;
- pump limit persistence across reboot.

## How to run the audit

1. Copy `INDEPENDENT_AI_AUDIT_PROMPT.md` into the reviewing AI.
2. Attach the four primary files, current implementation files, legacy contradiction files, and physical evidence.
3. Require the exact output format in the prompt.
4. Do not accept approval based only on prose. Resolve S0/S1 findings and record physical checks.
5. Run the second-pass prompt after corrections.

## Source-of-truth transition

Until audit and physical validation finish:

```text
FINAL_WIRING_REV_B.md = proposed Rev B design
PHYSICAL_VERIFICATION_RECORD.md = evidence ledger
legacy Rev A docs = historical context only
current firmware = known incompatible implementation
```

After acceptance, rename/status `FINAL_WIRING_REV_B.md` as `AS-BUILT`, update canonical `docs/03-technical/wiring-schematic.md`, and archive/supersede contradictory Rev A sections explicitly.
