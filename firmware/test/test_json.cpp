#include <Arduino.h>
#include <cstdio>
#include <cstring>
#include "status_json.h"
#include "actuators.h"
#include <vector>

std::vector<PinRecord> g_pinOps;

static int failed=0;
#define CHECK(c,m) do{ if(!(c)){printf("FAIL: %s\n",m);failed++;} else printf("ok: %s\n",m);}while(0)

int main(){
  actuators::initSafeState();
  SensorReading s;
  s.temperature_c=22.4f; s.humidity_pct=78.1f; s.lux=3200; s.soil_pct=62.5f;
  s.soil_raw_adc=1900; s.psu_voltage=12.05f;

  char buf[1024];
  size_t n=status_json::buildStatus(buf,sizeof buf,s,Fault::NONE,"0.1.0",true,-60,true,1751457600000LL);
  CHECK(n>0, "buildStatus menulis buffer");
  CHECK(strstr(buf,"\"temperature_c\":22.4"),"ada temperature_c");
  CHECK(strstr(buf,"\"soil_raw_adc\":1900"),"ada soil_raw_adc");
  CHECK(strstr(buf,"\"growlight\":{\"state\":false"),"actuator growlight objek");
  CHECK(strstr(buf,"\"fan\":{\"state\":false"),"actuator fan objek");
  CHECK(strstr(buf,"\"active_code\":\"NONE\""),"fault code NONE");
  CHECK(strstr(buf,"\"time_synced\":true"),"time_synced true");
  CHECK(strstr(buf,"\"last_seen\":1751457600000"),"last_seen epoch");

  char tel[512];
  size_t m=status_json::buildTelemetrySample(tel,sizeof tel,1751457600000LL,s);
  CHECK(m>0,"buildTelemetry menulis buffer");
  CHECK(strstr(tel,"\"t\":22.4"),"telemetry t number");
  CHECK(strstr(tel,"\"h\":78.1"),"telemetry h number");
  CHECK(strstr(tel,"\"l\":3200"),"telemetry l number");
  CHECK(strstr(tel,"\"s\":62.5"),"telemetry s number");
  CHECK(strstr(tel,"\"gl\":false"),"telemetry gl bool");
  CHECK(strstr(tel,"\"p\":false") && strstr(tel,"\"m\":false") && strstr(tel,"\"f\":false"),"telemetry p/m/f bool");
  CHECK(strstr(tel,"\"ts\":1751457600000"),"telemetry ts epoch ms");

  printf("\n%s\n", failed==0?"ALL PASSED":"SOME FAILED");
  return failed==0?0:1;
}
