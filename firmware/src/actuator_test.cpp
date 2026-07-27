#include <Arduino.h>

namespace {
struct Channel {
  uint8_t pin;
  const char* name;
  bool activeHigh;
  bool on;
};

Channel channels[] = {
  {16, "Growlight SSR", true, false},
  {17, "Pump relay", true, false},
  {18, "Mist 1 relay", true, false},
  {19, "Fan 1 relay", true, false},
  {23, "Mist 2 relay", true, false},
  {32, "Fan 2 relay", true, false},
  {25, "Spare SSR", true, false},
};

void writeChannel(Channel& channel, bool on) {
  channel.on = on;
  digitalWrite(channel.pin, on == channel.activeHigh ? HIGH : LOW);
  Serial.printf("GPIO %u - %s: %s\n", channel.pin, channel.name, on ? "ON" : "OFF");
}

void allOff() {
  for (auto& channel : channels) writeChannel(channel, false);
}

void printMenu() {
  Serial.println("\nSnowberry actuator test (no loads):");
  Serial.println("  1 = toggle GPIO 16 / growlight SSR");
  Serial.println("  2 = toggle GPIO 17 / pump relay");
  Serial.println("  3 = toggle GPIO 18 / mist relay");
  Serial.println("  4 = toggle GPIO 19 / fan 1 relay");
  Serial.println("  5 = toggle GPIO 23 / mist 2 relay");
  Serial.println("  6 = toggle GPIO 32 / fan 2 relay");
  Serial.println("  0 = force all OFF");
  Serial.println("  ? = show this menu");
}
}  // namespace

void setup() {
  // Latch safe levels before enabling outputs.
  digitalWrite(16, LOW);
  digitalWrite(17, LOW);
  digitalWrite(18, LOW);
  digitalWrite(19, LOW);
  digitalWrite(23, LOW);
  digitalWrite(32, LOW);
  digitalWrite(25, LOW);
  for (auto& channel : channels) pinMode(channel.pin, OUTPUT);

  Serial.begin(115200);
  delay(100);
  allOff();
  printMenu();
}

void loop() {
  if (!Serial.available()) return;

  const char command = Serial.read();
  if (command >= '1' && command <= '6') {
    Channel& channel = channels[command - '1'];
    writeChannel(channel, !channel.on);
  } else if (command == '0') {
    allOff();
  } else if (command == '?') {
    printMenu();
  }
}
