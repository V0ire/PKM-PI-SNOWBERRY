#include <Arduino.h>
#include <cstdio>
#include <cassert>
#include <vector>
#include "control.h"
#include "actuators.h"
#include "config.h"

// Definisikan global pin operations log dari Arduino.h stub.
std::vector<PinRecord> g_pinOps;

using AK = ActuatorKey;
static int failed = 0;
#define CHECK(cond, msg) do{ if(!(cond)){ printf("FAIL: %s\n", msg); failed++; } else { printf("ok: %s\n", msg);} }while(0)

static SensorReading mkSensor() {
  SensorReading s;
  s.temp_valid=s.rh_valid=s.lux_valid=s.soil_valid=s.psu_valid=true;
  s.temperature_c=22; s.humidity_pct=75; s.lux=3000; s.soil_pct=60; s.psu_voltage=12;
  return s;
}

int main() {
  Thresholds t;                 // default Ciwidey
  t.soil_adc_dry=3000; t.soil_adc_wet=1000;  // sudah kalibrasi
  t.pump_pulse_ms=1000; t.soak_period_ms=5000;
  control::ManualCommand noCmd;
  control::TimeCtx tsync; tsync.synced=true; tsync.hour=12; tsync.epoch_ms=1000LL*3600*12;
  Fault f;

  // 1) Validasi threshold
  CHECK(control::validate(t), "default thresholds valid");
  Thresholds bad=t; bad.temp_low=bad.temp_high;
  CHECK(!control::validate(bad), "temp_low==temp_high ditolak");
  Thresholds badPump=t; badPump.pump_pulse_ms=99999; badPump.soak_period_ms=1000;
  CHECK(!control::validate(badPump), "pulse>soak ditolak");

  // 2) Soil percent + pinned ADC
  float pct;
  CHECK(control::soilPercent(t,2000,pct) && pct>40 && pct<60, "soil mid-range ~50%");
  CHECK(!control::soilPercent(t,4095,pct), "soil pinned 4095 ditolak");
  Thresholds uncal=t; uncal.soil_adc_dry=0;
  CHECK(!control::soilPercent(uncal,2000,pct), "soil belum kalibrasi ditolak");

  // 3) FAN & MIST: Humidifier RH-only (Rev B)
  actuators::initSafeState();
  SensorReading s=mkSensor(); s.humidity_pct=90; // > rh_high(85)
  control::step(t,s,noCmd,tsync,1000000,f);
  CHECK(!actuators::isOn(AK::FAN), "RH tinggi -> Humidifier OFF");
  CHECK(!actuators::isOn(AK::MIST), "RH tinggi -> MIST OFF");

  // 4) Suhu tinggi tidak memicu humidifier di Rev B (RH-only)
  actuators::initSafeState();
  s=mkSensor(); s.temperature_c=30; // > temp_high(28)
  control::step(t,s,noCmd,tsync,2000000,f);
  CHECK(!actuators::isOn(AK::FAN), "suhu tinggi -> Humidifier tetap OFF (RH-only)");

  // 5) Kering (RH 60% <= rh_low 65%) -> 4 pin humidifier ON
  actuators::initSafeState();
  s=mkSensor(); s.humidity_pct=60; s.temperature_c=30; // kering & panas
  control::step(t,s,noCmd,tsync,3000000,f);
  CHECK(actuators::isOn(AK::FAN), "kering -> FAN ON");
  CHECK(actuators::isOn(AK::MIST), "kering -> MIST ON");

  // 6) MIST: kering + suhu normal -> 4 pin humidifier ON
  actuators::initSafeState();
  s=mkSensor(); s.humidity_pct=60; s.temperature_c=22;
  control::step(t,s,noCmd,tsync,4000000,f);
  CHECK(actuators::isOn(AK::MIST), "kering+suhu normal -> MIST ON");
  CHECK(actuators::isOn(AK::FAN), "kering+suhu normal -> FAN ON");

  // 7) Soil invalid -> pump OFF (safety)
  actuators::initSafeState();
  s=mkSensor(); s.soil_valid=false; s.soil_pct=10;
  control::step(t,s,noCmd,tsync,5000000,f);
  CHECK(!actuators::isOn(AK::PUMP), "soil invalid -> PUMP OFF");

  // 8) Soil rendah (<= soil_low 30%) -> pump mulai menyiram
  actuators::initSafeState();
  s=mkSensor(); s.soil_pct=25; // < soil_low(30)
  control::step(t,s,noCmd,tsync,6000000,f);
  CHECK(actuators::isOn(AK::PUMP), "soil rendah -> PUMP ON (pulse)");

  // 9) Growlight: gelap dalam window -> ON
  actuators::initSafeState();
  s=mkSensor(); s.lux=500; // < lux_low(2000)
  control::TimeCtx day; day.synced=true; day.hour=10; day.epoch_ms=1000LL*3600*10;
  control::step(t,s,noCmd,day,7000000,f);
  CHECK(actuators::isOn(AK::GROWLIGHT), "gelap dalam window -> GROWLIGHT ON");

  // 10) Growlight: gelap DILUAR window (malam) -> OFF (photoperiod)
  actuators::initSafeState();
  s=mkSensor(); s.lux=100;
  control::TimeCtx night; night.synced=true; night.hour=22; night.epoch_ms=1000LL*3600*22;
  control::step(t,s,noCmd,night,8000000,f);
  CHECK(!actuators::isOn(AK::GROWLIGHT), "gelap di luar window -> GROWLIGHT OFF");

  // 11) Manual override pump ON saat soil invalid -> ditolak (safety)
  actuators::initSafeState();
  s=mkSensor(); s.soil_valid=false;
  control::ManualCommand cmd; cmd.valid=true; cmd.key=AK::PUMP; cmd.mode=Mode::MANUAL;
  cmd.state=true; cmd.duration_ms=600000; cmd.manual_until_epoch=tsync.epoch_ms+600000;
  control::step(t,s,cmd,tsync,9000000,f);
  CHECK(!actuators::isOn(AK::PUMP), "manual pump ON + soil invalid -> ditolak");
  CHECK(f==Fault::COMMAND_REJECTED_SAFETY, "fault COMMAND_REJECTED_SAFETY diset");

  // 12) Manual override growlight ON valid -> diterapkan
  actuators::initSafeState();
  s=mkSensor(); s.lux=8000; // terang, auto akan OFF
  control::ManualCommand gcmd; gcmd.valid=true; gcmd.key=AK::GROWLIGHT; gcmd.mode=Mode::MANUAL;
  gcmd.state=true; gcmd.duration_ms=600000; gcmd.manual_until_epoch=tsync.epoch_ms+600000;
  control::step(t,s,gcmd,tsync,10000000,f);
  CHECK(actuators::isOn(AK::GROWLIGHT), "manual growlight ON -> diterapkan walau terang");

  // 13) Manual expired -> tidak diterapkan
  actuators::initSafeState();
  s=mkSensor();
  control::ManualCommand ecmd=gcmd; ecmd.manual_until_epoch=tsync.epoch_ms-1;
  control::step(t,s,ecmd,tsync,11000000,f);
  CHECK(f==Fault::COMMAND_EXPIRED, "manual expired -> fault COMMAND_EXPIRED");

  // ==========================================================================
  // BLOCKER AUDIT TEST CASES
  // ==========================================================================

  // 14) Manual command saat time.synced=false BELUM expired sebelum duration_ms
  {
    actuators::initSafeState();
    s = mkSensor();
    control::TimeCtx noSync; noSync.synced = false; noSync.epoch_ms = 0;
    control::ManualCommand mcmd;
    mcmd.valid = true;
    mcmd.key = AK::PUMP;
    mcmd.mode = Mode::MANUAL;
    mcmd.state = true;
    mcmd.duration_ms = 100000; // 100 detik
    mcmd.received_at_ms = 50000; // diterima pada t = 50 detik
    
    // Test pada t = 140 detik (delta 90 detik, < 100 detik duration) -> Belum expired, pump ON
    control::step(t, s, mcmd, noSync, 140000, f);
    CHECK(actuators::isOn(AK::PUMP), "noSync manual: PUMP ON sebelum durasi berakhir");
    CHECK(f == Fault::NONE, "noSync manual: tidak ada fault sebelum durasi berakhir");
  }

  // 15) Manual command saat time.synced=false HARUS expired setelah duration_ms
  {
    actuators::initSafeState();
    s = mkSensor();
    control::TimeCtx noSync; noSync.synced = false; noSync.epoch_ms = 0;
    control::ManualCommand mcmd;
    mcmd.valid = true;
    mcmd.key = AK::PUMP;
    mcmd.mode = Mode::MANUAL;
    mcmd.state = true;
    mcmd.duration_ms = 100000;
    mcmd.received_at_ms = 50000;
    
    // Test pada t = 150000 (delta 100 detik = duration) -> Expired, pump AUTO/OFF
    control::step(t, s, mcmd, noSync, 150000, f);
    CHECK(!actuators::isOn(AK::PUMP), "noSync manual: PUMP OFF setelah durasi berakhir");
    CHECK(f == Fault::COMMAND_EXPIRED, "noSync manual: fault COMMAND_EXPIRED diset");
  }

  // 16) Manual command tidak mengalahkan sensor invalid safety
  {
    actuators::initSafeState();
    s = mkSensor();
    s.soil_valid = false; // sensor rusak/lepas
    control::TimeCtx noSync; noSync.synced = false;
    control::ManualCommand mcmd;
    mcmd.valid = true;
    mcmd.key = AK::PUMP;
    mcmd.mode = Mode::MANUAL;
    mcmd.state = true;
    mcmd.duration_ms = 100000;
    mcmd.received_at_ms = 50000;

    // Walau manual state = true dan belum expired, sensor invalid wajib mematikan pompa
    control::step(t, s, mcmd, noSync, 60000, f);
    CHECK(!actuators::isOn(AK::PUMP), "manual command ditolak/OFF jika sensor invalid");
    CHECK(f == Fault::COMMAND_REJECTED_SAFETY, "fault COMMAND_REJECTED_SAFETY aktif");
  }

  // 17) Safe boot init menulis OFF level sebelum pinMode OUTPUT (Blocker 1)
  {
    clearPinOps();
    actuators::initSafeState();
    
    // Verifikasi urutan operasi untuk semua pin aktuator yang ada.
    // Untuk setiap pin: WRITE_LOW/HIGH harus muncul sebelum MODE_OUTPUT.
    bool orderOk = true;
    uint8_t targetPins[] = { pins::GROWLIGHT, pins::PUMP, pins::MIST, pins::FAN, pins::MIST_2, pins::FAN_2, pins::SPARE_SSR };
    
    for (uint8_t pin : targetPins) {
      int firstWriteIdx = -1;
      int firstModeIdx = -1;
      for (size_t i = 0; i < g_pinOps.size(); i++) {
        if (g_pinOps[i].pin == pin) {
          if (g_pinOps[i].op == PinOp::WRITE_LOW || g_pinOps[i].op == PinOp::WRITE_HIGH) {
            if (firstWriteIdx == -1) firstWriteIdx = i;
          }
          if (g_pinOps[i].op == PinOp::MODE_OUTPUT) {
            if (firstModeIdx == -1) firstModeIdx = i;
          }
        }
      }
      
      // Pastikan write dilakukan sebelum pinMode
      if (firstWriteIdx == -1 || firstModeIdx == -1 || firstWriteIdx > firstModeIdx) {
        printf("FAIL safe boot order pin %d: write_idx=%d, mode_idx=%d\n", pin, firstWriteIdx, firstModeIdx);
        orderOk = false;
      }
    }
    CHECK(orderOk, "Safe boot: menulis offLevel sebelum pinMode OUTPUT");
  }

  // 18) Rev B boot contract: safe boot menulis level LOW fisik ke semua 7 output.
  {
    clearPinOps();
    actuators::initSafeState();
    bool levelOk = true;
    uint8_t targetPins[] = { pins::GROWLIGHT, pins::PUMP, pins::MIST, pins::FAN, pins::MIST_2, pins::FAN_2, pins::SPARE_SSR };
    for (uint8_t pin : targetPins) {
      for (const auto& rec : g_pinOps) {
        if (rec.pin == pin && rec.op == PinOp::WRITE_HIGH) {
          printf("FAIL boot level pin %d: WRITE_HIGH terdeteksi saat safe boot\n", pin);
          levelOk = false;
        }
      }
    }
    CHECK(levelOk, "Rev B safe boot: semua 7 output ditulis LOW (tidak ada WRITE_HIGH)");
  }

  // 19) Humidifier control: 4 physical outputs switch together on RH
  {
    actuators::initSafeState();
    s = mkSensor(); s.humidity_pct = 60; // < rh_low (65)
    control::step(t, s, noCmd, tsync, 12000000, f);
    CHECK(actuators::isOn(AK::MIST) && actuators::isOn(AK::FAN) &&
          actuators::isOn(AK::MIST_2) && actuators::isOn(AK::FAN_2),
          "Humidifier ON -> 4 physical pins (18,19,23,32) HIGH bersamaan");
  }

  printf("\n%s\n", failed==0 ? "ALL PASSED" : "SOME FAILED");
  return failed==0 ? 0 : 1;
}
