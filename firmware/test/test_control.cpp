#include <cstdio>
#include <cassert>
#include "control.h"
#include "actuators.h"

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

  // 3) FAN: RH tinggi -> fan ON, mist OFF
  actuators::initSafeState();
  SensorReading s=mkSensor(); s.humidity_pct=90; // > rh_high(85)
  control::step(t,s,noCmd,tsync,1000000,f);
  CHECK(actuators::isOn(AK::FAN), "RH tinggi -> FAN ON");
  CHECK(!actuators::isOn(AK::MIST), "RH tinggi -> MIST OFF");

  // 4) FAN: suhu tinggi -> fan ON
  actuators::initSafeState();
  s=mkSensor(); s.temperature_c=30; // > temp_high(28)
  control::step(t,s,noCmd,tsync,2000000,f);
  CHECK(actuators::isOn(AK::FAN), "suhu tinggi -> FAN ON");

  // 5) Konflik: RH rendah + suhu tinggi -> fan menang, mist ditahan
  actuators::initSafeState();
  s=mkSensor(); s.humidity_pct=60; s.temperature_c=30; // kering & panas
  control::step(t,s,noCmd,tsync,3000000,f);
  CHECK(actuators::isOn(AK::FAN), "kering+panas -> FAN ON");
  CHECK(!actuators::isOn(AK::MIST), "kering+panas -> MIST ditahan (tidak melawan)");

  // 6) MIST: kering + suhu normal -> mist ON
  actuators::initSafeState();
  s=mkSensor(); s.humidity_pct=60; s.temperature_c=22;
  control::step(t,s,noCmd,tsync,4000000,f);
  CHECK(actuators::isOn(AK::MIST), "kering+suhu normal -> MIST ON");
  CHECK(!actuators::isOn(AK::FAN), "kering+suhu normal -> FAN OFF");

  // 7) Soil invalid -> pump OFF (safety)
  actuators::initSafeState();
  s=mkSensor(); s.soil_valid=false; s.soil_pct=10;
  control::step(t,s,noCmd,tsync,5000000,f);
  CHECK(!actuators::isOn(AK::PUMP), "soil invalid -> PUMP OFF");

  // 8) Soil rendah -> pump mulai menyiram
  actuators::initSafeState();
  s=mkSensor(); s.soil_pct=40; // < soil_low(50)
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

  printf("\n%s\n", failed==0 ? "ALL PASSED" : "SOME FAILED");
  return failed==0 ? 0 : 1;
}
