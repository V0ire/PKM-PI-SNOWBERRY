import assert from "node:assert/strict";
import { createManualCommand } from "./dataSource";

const now = 1_000_000;
const lamp = createManualCommand("growlight", "MANUAL", true, "uid", now);
assert.equal(lamp.actuator, "growlight");
assert.equal(lamp.manual_until, now + 30 * 60_000);
assert.equal(lamp.issued_by, "uid");
const pump = createManualCommand("pump", "MANUAL", true, "uid", now);
assert.equal(pump.manual_until, now + 30 * 60_000, "command pompa harus tetap punya batas validitas");
assert.equal(pump.actuator, "pump", "firmware menafsirkan command pompa sebagai satu pulse, bukan manual ON berkelanjutan");
assert.equal(createManualCommand("humidifier", "AUTO", false, "uid", now).manual_until, now);
assert.notEqual(createManualCommand("growlight", "MANUAL", true, "uid", now).command_id, lamp.command_id);
console.log("commandPayload.check: lolos");
