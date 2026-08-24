#include <Arduino.h>
#include <cstdio>
#include <vector>

#include "actuators.h"
#include "config.h"
#include "control.h"

std::vector<PinRecord> g_pinOps;

using AK = ActuatorKey;
static int failed = 0;
#define CHECK(c, m) do { if (!(c)) { std::printf("FAIL: %s\n", m); ++failed; } } while (0)

static SensorReading validSensor(uint32_t now) {
  SensorReading s;
  s.temperature_c = 22;
  s.humidity_pct = 75;
  s.lux = 3000;
  s.soil_raw_adc = 2300;
  s.soil_pct = 60;
  s.temp_valid = s.rh_valid = s.lux_valid = s.soil_valid = true;
  s.rh_sample_ms = s.lux_sample_ms = s.soil_sample_ms = now;
  return s;
}

static control::TimeCtx syncedTime() {
  control::TimeCtx t;
  t.synced = true;
  t.hour = 12;
  t.epoch_ms = 1800000000000LL;
  return t;
}

static control::ManualCommand manual(ManualTarget target, bool on, uint32_t now) {
  control::ManualCommand c;
  c.valid = true;
  c.target = target;
  c.mode = Mode::MANUAL;
  c.state = on;
  c.duration_ms = 60000;
  c.received_at_ms = now;
  return c;
}

static bool reserveOk(const control::PumpStartRecord&) { return true; }
static bool reserveFail(const control::PumpStartRecord&) { return false; }

int main() {
  Thresholds t;
  control::TimeCtx time = syncedTime();
  control::ManualCommand none;
  Fault fault;

  CHECK(t.soil_adc_dry == 3500 && t.soil_adc_wet == 1500, "local calibration defaults");
  CHECK(t.pump_start_limit == 2 && t.pump_pulse_ms == 45000 &&
        t.soak_period_ms == 900000 && t.pump_window_ms == 18000000,
        "fixed pump safety constants");
  CHECK(control::validate(t), "defaults valid");
  Thresholds unsafe = t;
  unsafe.pump_start_limit = 3;
  CHECK(!control::validate(unsafe), "pump start limit is immutable");
  unsafe = t;
  unsafe.pump_window_ms = 1;
  CHECK(!control::validate(unsafe), "pump window is immutable");

  float pct = -1;
  CHECK(control::soilPercent(t, 3500, pct) && pct == 0, "3500 is 0 percent");
  CHECK(control::soilPercent(t, 3000, pct) && pct == 25, "3000 is 25 percent");
  CHECK(control::soilPercent(t, 2500, pct) && pct == 50, "2500 is 50 percent");
  CHECK(control::soilPercent(t, 2000, pct) && pct == 75, "2000 is 75 percent");
  CHECK(control::soilPercent(t, 1500, pct) && pct == 100, "1500 is 100 percent");

  clearPinOps();
  actuators::initSafeState();
  const uint8_t pinsToCheck[] = {16, 25, 17, 18, 19, 23, 32};
  for (uint8_t pin : pinsToCheck) {
    int firstWrite = -1, mode = -1;
    for (size_t i = 0; i < g_pinOps.size(); ++i) {
      if (g_pinOps[i].pin != pin) continue;
      if (firstWrite < 0 && g_pinOps[i].op == PinOp::WRITE_LOW) firstWrite = static_cast<int>(i);
      if (mode < 0 && g_pinOps[i].op == PinOp::MODE_OUTPUT) mode = static_cast<int>(i);
    }
    CHECK(firstWrite >= 0 && mode > firstWrite, "each output LOW before OUTPUT");
  }
  CHECK(!actuators::applySpareForTest(true, 1), "GPIO25 cannot be enabled");

  control::setPumpStartReserver(reserveOk);
  control::resetForTest();
  actuators::initSafeState();
  SensorReading s = validSensor(100000);
  auto humidifierOn = manual(ManualTarget::HUMIDIFIER, true, 100000);
  control::step(t, s, humidifierOn, time, 100001, fault);
  CHECK(actuators::isOn(AK::MIST) && actuators::isOn(AK::FAN) &&
        actuators::isOn(AK::MIST_2) && actuators::isOn(AK::FAN_2),
        "manual humidifier switches all four channels together");

  s.rh_sample_ms = 80000;
  control::step(t, s, humidifierOn, time, 100002, fault);
  CHECK(!actuators::isOn(AK::MIST) && !actuators::isOn(AK::FAN) &&
        !actuators::isOn(AK::MIST_2) && !actuators::isOn(AK::FAN_2) &&
        fault == Fault::COMMAND_REJECTED_SAFETY,
        "stale RH rejects manual humidifier ON");

  control::resetForTest();
  actuators::initSafeState();
  s = validSensor(200000);
  s.soil_pct = 20;
  auto pumpOn = manual(ManualTarget::PUMP, true, 200000);
  control::step(t, s, pumpOn, time, 200001, fault);
  CHECK(actuators::isOn(AK::PUMP), "manual pump starts one normal pulse");
  s.soil_sample_ms = 245001;
  control::step(t, s, none, time, 245001, fault);
  CHECK(!actuators::isOn(AK::PUMP), "manual pump stops at 45 seconds");
  control::step(t, s, pumpOn, time, 245002, fault);
  CHECK(!actuators::isOn(AK::PUMP), "manual pump obeys soak lock");

  control::resetForTest();
  actuators::initSafeState();
  control::setPumpStartReserver(reserveFail);
  s = validSensor(300000);
  s.soil_pct = 20;
  pumpOn = manual(ManualTarget::PUMP, true, 300000);
  control::step(t, s, pumpOn, time, 300001, fault);
  CHECK(!actuators::isOn(AK::PUMP), "pump never energizes if NVS reservation fails");

  control::resetForTest();
  actuators::initSafeState();
  control::setPumpStartReserver(reserveOk);
  control::restorePumpSafety(nullptr, 0, false, 0);
  pumpOn = manual(ManualTarget::PUMP, true, 310000);
  control::step(t, s, pumpOn, time, 310000, fault);
  CHECK(!actuators::isOn(AK::PUMP), "reboot without trustworthy time stays pump locked");

  control::resetForTest();
  actuators::initSafeState();
  control::PumpStartRecord unknownTimeStarts[2] = {{0, 100}, {0, 200}};
  control::restorePumpSafety(unknownTimeStarts, 2, true, time.epoch_ms);
  pumpOn = manual(ManualTarget::PUMP, true, 320000);
  control::step(t, s, pumpOn, time, 320001, fault);
  CHECK(!actuators::isOn(AK::PUMP), "NTP sync cannot erase starts reserved without time");

  control::resetForTest();
  actuators::initSafeState();
  control::PumpStartRecord recentStart[1] = {{time.epoch_ms - 60000, 0}};
  control::restorePumpSafety(recentStart, 1, true, time.epoch_ms);
  pumpOn = manual(ManualTarget::PUMP, true, 330000);
  control::step(t, s, pumpOn, time, 330001, fault);
  CHECK(!actuators::isOn(AK::PUMP), "reboot reconstructs remaining 15-minute soak lock");

  control::resetForTest();
  actuators::initSafeState();
  s = validSensor(400000);
  s.lux = 100;
  time.synced = false;
  control::step(t, s, none, time, 400001, fault);
  CHECK(!actuators::isOn(AK::GROWLIGHT), "unsynchronized time blocks growlight");
  time = syncedTime();
  s.lux_sample_ms = 380000;
  control::step(t, s, none, time, 400002, fault);
  CHECK(!actuators::isOn(AK::GROWLIGHT), "stale lux blocks growlight");

  // --- Jendela siram sore (15:00-18:00) ---
  control::resetForTest();
  actuators::initSafeState();
  control::setPumpStartReserver(reserveOk);
  s = validSensor(500000);
  s.soil_pct = 20;  // keros
  time = syncedTime();
  time.hour = 12;   // siang
  control::step(t, s, none, time, 500001, fault);
  CHECK(!actuators::isOn(AK::PUMP), "soil dry at noon does not auto water");
  CHECK(control::reasonOf(AK::PUMP) == Reason::WATER_WINDOW_WAIT, "noon dry reports water_window_wait");
  time.hour = 15;   // mulai sore
  control::step(t, s, none, time, 500002, fault);
  CHECK(actuators::isOn(AK::PUMP), "auto watering starts at 15:00");
  control::resetForTest();
  actuators::initSafeState();
  time.hour = 18;   // habis maghrib
  control::step(t, s, none, time, 500003, fault);
  CHECK(!actuators::isOn(AK::PUMP), "auto watering stops after 18:00");
  time.synced = false;
  time.hour = 16;   // sore tapi jam belum sinkron
  control::step(t, s, none, time, 500004, fault);
  CHECK(!actuators::isOn(AK::PUMP), "no auto watering without synced time");
  time = syncedTime();
  time.hour = 10;   // pagi, manual tetap boleh
  pumpOn = manual(ManualTarget::PUMP, true, 500005);
  control::step(t, s, pumpOn, time, 500005, fault);
  CHECK(actuators::isOn(AK::PUMP), "manual pump works outside water window");

  // --- Jendela lampu tanam (18:00-20:00) ---
  // Catatan: growlight punya minimum hold 5 s di actuators::apply, maka
  // antar-langkah diberi jeda >= 5 detik.
  control::resetForTest();
  actuators::initSafeState();
  s = validSensor(600000);
  s.lux = 100;      // gelap
  time = syncedTime();
  time.hour = 17;   // sebelum jendela
  control::step(t, s, none, time, 600001, fault);
  CHECK(!actuators::isOn(AK::GROWLIGHT), "growlight stays off before 18:00");
  CHECK(control::reasonOf(AK::GROWLIGHT) == Reason::PHOTOPERIOD_LIMIT, "pre-window reason photoperiod_limit");
  time.hour = 18;   // jendela buka
  control::step(t, s, none, time, 606001, fault);
  CHECK(actuators::isOn(AK::GROWLIGHT), "growlight auto on inside window when dark");
  time.hour = 20;   // jendela tutup
  control::step(t, s, none, time, 612001, fault);
  CHECK(!actuators::isOn(AK::GROWLIGHT), "growlight forced off after 20:00");
  time.hour = 23;   // malam, manual tetap boleh
  s.lux_sample_ms = 617000;  // segarkan sampel agar tidak stale (>15 s)
  auto lightOn = manual(ManualTarget::GROWLIGHT, true, 618001);
  control::step(t, s, lightOn, time, 618001, fault);
  CHECK(actuators::isOn(AK::GROWLIGHT), "manual growlight works outside window");
  // Terang di siang hari tidak boleh menyalakan lampu walau dalam window.
  control::resetForTest();
  actuators::initSafeState();
  s.lux = 20000;
  time.hour = 19;
  control::step(t, s, none, time, 600005, fault);
  CHECK(!actuators::isOn(AK::GROWLIGHT), "bright lux keeps growlight off inside window");

  std::printf("%s\n", failed ? "SOME FAILED" : "ALL PASSED");
  return failed ? 1 : 0;
}