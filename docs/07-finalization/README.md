# Snowberry Finalization Documents

This directory contains the Rev B design/audit packet.

- `FINAL_WIRING_REV_B.md` — detailed wiring candidate.
- `HARDWARE_FIRMWARE_CONTRACT.md` — required software behavior and GPIO contract.
- `PHYSICAL_VERIFICATION_RECORD.md` — evidence checklist and as-built measurements.
- `INDEPENDENT_AI_AUDIT_PROMPT.md` — prompt for adversarial external review.
- `AUDIT_PACKET_INDEX.md` — files/photos/evidence to attach.
- `PROJECT_LOGIC_AND_ARCHITECTURE.md` — complete Rev B logic, system layers, state machines, protection, cloud, UI, packaging, and deployment architecture.
- `EASYEDA_SCHEMATIC_REV_B.md` — schematic design summary, verification table, one-to-one connection table, and BOM.
- `../../hardware/schematic/SNOWBERRY_REV_B_EASYEDA.svg` — editable vector schematic canvas.
- `../../hardware/schematic/SNOWBERRY_REV_B_EASYEDA.png` — 3200×1800 raster schematic.
- `../../hardware/schematic/SNOWBERRY_REV_B_EASYEDA.pdf` — printable vector schematic.

These documents are intentionally marked **audit candidate**. They do not claim unresolved relay pinouts, fuse values, load currents, SSR pairing, or actuator feedback as verified facts.

Critical rule: current firmware is incompatible with Rev B active-HIGH five-relay wiring. Do not connect final relay inputs until the hardware–firmware contract is implemented and boot tests pass.
