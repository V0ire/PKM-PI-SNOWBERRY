#include "actuators.h"
#include <cstdint>
namespace {
struct C { bool on=false; uint32_t last=0; uint32_t minOn; uint32_t minOff; };
C g[4] = {
  {false,0,300000,300000}, // growlight
  {false,0,0,0},           // pump
  {false,0,5000,30000},    // mist
  {false,0,30000,30000},   // fan
};
}
namespace actuators {
void initSafeState(){ for(auto&c:g){c.on=false;c.last=0;} }
bool apply(ActuatorKey k, bool on, uint32_t now){
  C&c=g[(int)k];
  if(on==c.on) return false;
  uint32_t held=now-c.last;
  if(c.on && held<c.minOn) return false;
  if(!c.on && held<c.minOff) return false;
  c.on=on; c.last=now; return true;
}
void forceOff(ActuatorKey k, uint32_t now){ C&c=g[(int)k]; if(c.on){c.on=false;c.last=now;} }
bool isOn(ActuatorKey k){ return g[(int)k].on; }
uint32_t lastChangedMs(ActuatorKey k){ return g[(int)k].last; }
uint32_t minOnMs(ActuatorKey k){ return g[(int)k].minOn; }
uint32_t minOffMs(ActuatorKey k){ return g[(int)k].minOff; }
}
