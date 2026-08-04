#include "calibration.h"
namespace calibration {
void Machine::start(uint32_t now){state_=State::WAIT_RELEASE_DRY;started_=now;dry_=0;}
Result Machine::update(bool pressed,uint16_t raw,uint32_t now){
 Result out;
 if(!active())return out;
 if(now-started_>=TIMEOUT_MS){state_=State::CANCELLED;return out;}
 switch(state_){
  case State::WAIT_RELEASE_DRY: if(!pressed)state_=State::WAIT_DRY; break;
  case State::WAIT_DRY: if(pressed){dry_=raw;state_=State::WAIT_RELEASE_WET;} break;
  case State::WAIT_RELEASE_WET: if(!pressed)state_=State::WAIT_WET; break;
  case State::WAIT_WET:
   if(pressed){
    if(dry_>raw&&dry_-raw>=100){state_=State::COMPLETE;out.ready=true;out.dry=dry_;out.wet=raw;}
    else state_=State::CANCELLED;
   }
   break;
  default: break;
 }
 return out;
}
void Machine::reset(){state_=State::IDLE;started_=0;dry_=0;}
bool Machine::active()const{return state_!=State::IDLE&&state_!=State::COMPLETE&&state_!=State::CANCELLED;}
}
