#include <Arduino.h>

void setup() {
  digitalWrite(17, LOW);
  pinMode(17, OUTPUT);
}

void loop() {
  digitalWrite(17, HIGH);
  delay(2000);
  digitalWrite(17, LOW);
  delay(2000);
}