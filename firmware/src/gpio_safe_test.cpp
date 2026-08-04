#ifndef SNOWBERRY_DIAGNOSTIC_BUILD
#error "gpio_safe_test requires SNOWBERRY_DIAGNOSTIC_BUILD"
#endif
#include <Arduino.h>
#include "config.h"

namespace {
struct Output { uint8_t pin; const char* name; };
Output outputs[]={{pins::GROWLIGHT,"Lampu Tanam"},{pins::PUMP,"Pompa Air"},{pins::HUMIDIFIER,"Pelembap Udara"}};
int selected=-1;
bool armed=false;
void allOff(){for(const auto& o:outputs)digitalWrite(o.pin,LOW);}
void menu(){Serial.println("\nDIAGNOSTIK OFFLINE - LEPAS KONTAK DAN BEBAN");Serial.println("1 Lampu, 2 Pompa, 3 Pelembap, 0 Semua OFF");}
}
void setup(){
  allOff(); for(const auto& o:outputs)pinMode(o.pin,OUTPUT); allOff();
  Serial.begin(115200); delay(100); menu();
}
void loop(){
  if(!Serial.available())return; char c=Serial.read();
  if(c=='0'){allOff();selected=-1;armed=false;Serial.println("Semua output OFF");return;}
  if(c>='1'&&c<='3'){allOff();selected=c-'1';armed=true;Serial.printf("Dipilih %s GPIO%u. Ketik Y untuk HIGH sekali, selain itu batal.\n",outputs[selected].name,outputs[selected].pin);return;}
  if((c=='Y'||c=='y')&&armed&&selected>=0){digitalWrite(outputs[selected].pin,HIGH);Serial.printf("GPIO%u HIGH. Ketik 0 untuk OFF.\n",outputs[selected].pin);armed=false;return;}
  allOff();selected=-1;armed=false;Serial.println("Dibatalkan; semua output OFF");
}
