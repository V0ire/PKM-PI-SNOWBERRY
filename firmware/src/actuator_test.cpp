#include <Arduino.h>

namespace {
struct Channel {
  uint8_t pin;
  const char* name;
  bool on;
};

// Rev B: every output is active-HIGH (LOW=OFF, HIGH=ON).
Channel channels[] = {
  {16, "Growlight SSR", false},
  {17, "Pump relay", false},
  {18, "Mist 1 relay", false},
  {19, "Fan 1 relay", false},
  {23, "Mist 2 relay", false},
  {32, "Fan 2 relay", false},
};

constexpr uint8_t SPARE_SSR = 25;

void writeChannel(Channel& channel, bool on) {
  channel.on = on;
  digitalWrite(channel.pin, on ? HIGH : LOW);
  Serial.printf("GPIO %u - %s: %s\n", channel.pin, channel.name,
                on ? "ON" : "OFF");
}

void allOff() {
  for (auto& channel : channels) writeChannel(channel, false);
  digitalWrite(SPARE_SSR, LOW);
}

void printMenu() {
  Serial.println("\nSnowberry Rev B actuator test — CONTACTS/LOADS MUST BE DISCONNECTED:");
  Serial.println("  1 = toggle GPIO16 / growlight SSR input");
  Serial.println("  2 = toggle GPIO17 / pump relay");
  Serial.println("  3 = toggle GPIO18 / mist 1 relay");
  Serial.println("  4 = toggle GPIO19 / fan 1 relay");
  Serial.println("  5 = toggle GPIO23 / mist 2 relay");
  Serial.println("  6 = toggle GPIO32 / fan 2 relay");
  Serial.println("  0 = force all OFF");
  Serial.println("  ? = show this menu");
  Serial.println("Rev B polarity: LOW=OFF, HIGH=ON.");
}
}  // namespace

void setup() {
  // Latch LOW before OUTPUT to prevent any boot pulse.
  for (auto& channel : channels) digitalWrite(channel.pin, LOW);
  digitalWrite(SPARE_SSR, LOW);
  for (auto& channel : channels) pinMode(channel.pin, OUTPUT);
  pinMode(SPARE_SSR, OUTPUT);

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
