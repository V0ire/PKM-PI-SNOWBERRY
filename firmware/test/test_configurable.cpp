#include <cassert>
#include <cstring>
#include <iostream>
#include <Arduino.h>
#include "actuators.h"
#include "calibration.h"
#include "config.h"
#include "control.h"
#include "status_json.h"
#include "types.h"

static uint8_t gpioLevel[40] = {0};
static bool outputSeen = false;
static int lowBeforeOutput = 0;
static uint32_t nowValue = 1000;

void digitalWrite(uint8_t pin, uint8_t value) {
  if (pin < 40) gpioLevel[pin] = value;
  if (!outputSeen && value == LOW) ++lowBeforeOutput;
}
void pinMode(uint8_t, uint8_t mode) { if (mode == OUTPUT) outputSeen = true; }
uint32_t millis() { return nowValue; }

int main() {
  static_assert(static_cast<int>(ActuatorKey::COUNT) == 3, "exactly three logical outputs");
  static_assert(pins::HUMIDIFIER == 18, "humidifier must use GPIO18");

  Thresholds t;
  assert(t.soil_adc_dry == 3500);
  assert(t.soil_adc_wet == 1500);
  assert(t.pump_pulse_ms == 45000);
  assert(t.soak_period_ms == 900000);
  assert(t.pump_start_limit == 2);
  assert(t.pump_window_ms == 18000000);
  assert(control::validate(t));
  Thresholds invalid = t;
  invalid.pump_pulse_ms = invalid.soak_period_ms;
  assert(!control::validate(invalid));
  invalid = t; invalid.rh_low = 96;
  assert(!control::validate(invalid));
  invalid = t; invalid.light_schedule_enabled = true; invalid.light_schedule_end_hour = invalid.light_schedule_start_hour;
  assert(!control::validate(invalid));

  float soilPct = -1;
  assert(control::soilPercent(t, 3500, soilPct) && soilPct == 0);
  assert(control::soilPercent(t, 2500, soilPct) && soilPct == 50);
  assert(control::soilPercent(t, 1500, soilPct) && soilPct == 100);

  actuators::initSafeState();
  assert(lowBeforeOutput == 3);
  assert(gpioLevel[pins::GROWLIGHT] == LOW);
  assert(gpioLevel[pins::PUMP] == LOW);
  assert(gpioLevel[pins::HUMIDIFIER] == LOW);

  SensorReading sensor;
  sensor.rh_valid = true;
  sensor.humidity_pct = 60;
  control::ManualCommand command;
  control::TimeCtx time;
  Fault fault = Fault::NONE;
  control::step(t, sensor, command, time, 10000, fault);
  assert(actuators::isOn(ActuatorKey::HUMIDIFIER));

  sensor.rh_valid = false;
  control::step(t, sensor, command, time, 20000, fault);
  assert(!actuators::isOn(ActuatorKey::HUMIDIFIER));
  command.valid = true; command.mode = Mode::MANUAL; command.key = ActuatorKey::HUMIDIFIER;
  command.state = true; command.duration_ms = 1800000; command.received_at_ms = 20000;
  control::step(t, sensor, command, time, 30000, fault);
  assert(actuators::isOn(ActuatorKey::HUMIDIFIER));

  command = {};
  sensor.lux_valid = true; sensor.lux = 100;
  Thresholds scheduled = t; scheduled.light_schedule_enabled = true;
  scheduled.light_schedule_start_hour = 18; scheduled.light_schedule_end_hour = 6;
  time.synced = true; time.hour = 23;
  control::step(scheduled, sensor, command, time, 400000, fault);
  assert(actuators::isOn(ActuatorKey::GROWLIGHT));
  time.hour = 12;
  control::step(scheduled, sensor, command, time, 800000, fault);
  assert(!actuators::isOn(ActuatorKey::GROWLIGHT));
  sensor.lux_valid = false; time.synced = false;
  command.valid = true; command.mode = Mode::MANUAL; command.key = ActuatorKey::GROWLIGHT;
  command.state = true; command.duration_ms = 1800000; command.received_at_ms = 800000;
  control::step(scheduled, sensor, command, time, 1200000, fault);
  assert(actuators::isOn(ActuatorKey::GROWLIGHT));

  command.manual_until_epoch = 1000;
  time.synced = true; time.epoch_ms = 1000;
  control::step(scheduled, sensor, command, time, 1200001, fault);
  assert(fault == Fault::COMMAND_EXPIRED);

  SensorReading drySoil;
  drySoil.soil_valid = true; drySoil.soil_pct = 10;
  control::ManualCommand pumpCommand;
  pumpCommand.valid = true; pumpCommand.mode = Mode::MANUAL;
  pumpCommand.key = ActuatorKey::PUMP; pumpCommand.state = true;
  pumpCommand.command_id = 42; pumpCommand.duration_ms = 1000;
  pumpCommand.manual_until_epoch = 2000000000000LL;
  control::TimeCtx trustedTime; trustedTime.synced = true; trustedTime.epoch_ms = 1900000000000LL;
  control::step(t, drySoil, pumpCommand, trustedTime, t.pump_window_ms - 1, fault);
  assert(!actuators::isOn(ActuatorKey::PUMP));
  assert(fault == Fault::PUMP_MAX_CYCLE_REACHED);

  drySoil.soil_valid = false;
  pumpCommand.command_id = 43;
  control::step(t, drySoil, pumpCommand, trustedTime, t.pump_window_ms + 1, fault);
  assert(!actuators::isOn(ActuatorKey::PUMP));
  assert(fault == Fault::COMMAND_REJECTED_SAFETY);

  char json[1400];
  sensor.temp_valid = true; sensor.rh_valid = true; sensor.lux_valid = true; sensor.soil_valid = true;
  control::ManualCommand statusManual;
  statusManual.valid = true; statusManual.mode = Mode::MANUAL;
  statusManual.key = ActuatorKey::HUMIDIFIER; statusManual.state = true;
  statusManual.manual_until_epoch = 2000;
  control::TimeCtx statusTime; statusTime.synced = true; statusTime.epoch_ms = 1234;
  size_t jsonSize = status_json::buildStatus(json, sizeof json, sensor, Fault::NONE, "test", true, -50, true, 1234, t.config_id, 10, statusManual, statusTime, 100, CalibrationSource::CALIBRATED);
  assert(jsonSize > 0);
  assert(std::strstr(json, "\"humidifier\"") != nullptr);
  assert(std::strstr(json, "\"mode\":\"MANUAL\"") != nullptr);
  assert(std::strstr(json, "\"manual_until\":2000") != nullptr);
  assert(std::strstr(json, "\"calibration_source\":\"CALIBRATED\"") != nullptr);
  assert(std::strstr(json, "mist_1") == nullptr);
  assert(std::strstr(json, "\"active_code\":null") != nullptr);

  calibration::Machine cal;
  cal.start(100);
  assert(cal.active());
  cal.update(false, 3500, 110);
  cal.update(true, 3500, 120);
  cal.update(false, 3500, 130);
  auto result = cal.update(true, 1500, 140);
  assert(result.ready && result.dry == 3500 && result.wet == 1500);
  cal.reset(); cal.start(100); cal.update(false, 3500, 110);
  cal.update(true, 3500, 120); cal.update(false, 3500, 130);
  result = cal.update(true, 3450, 140);
  assert(!result.ready && cal.state() == calibration::State::CANCELLED);

  std::cout << "configurable controller smoke test passed\n";
}
