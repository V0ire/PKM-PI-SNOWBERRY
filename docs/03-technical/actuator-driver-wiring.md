# Snowberry Actuator Driver Wiring

## Status and Scope

This document supersedes direct ESP32-to-mechanical-relay input wiring for the
current breadboard modules.

Bench testing established the following:

```text
Mechanical relay module S/IN = 0 V   -> relay OFF, COM-NC connected
Mechanical relay module S/IN = 5 V   -> relay ON, COM-NO connected
Mechanical relay module S/IN = 3.3 V -> unstable or chatters
```

The mechanical relays are therefore **5 V HIGH-trigger modules**. Do not
connect ESP32 GPIO 17, 18, or 19 directly to their inputs. A 3.3 V to 5 V
non-inverting driver is required.

The SSR remains a separate channel:

```text
GPIO 16 -> growlight SSR input
```

Its output side is AC only. Never put AC mains on a solderless breadboard.

## Pin Assignment

| Function | ESP32 GPIO | Output Type | Driver Requirement |
| --- | ---: | --- | --- |
| Growlight | 16 | AC SSR, active HIGH | Direct only if SSR input LED follows 0/3.3 V test |
| Pump | 17 | 5 V HIGH-trigger relay | 3.3 V to 5 V non-inverting driver |
| Mist maker | 18 | 5 V HIGH-trigger relay | 3.3 V to 5 V non-inverting driver |
| Fan | 19 | 5 V HIGH-trigger relay | 3.3 V to 5 V non-inverting driver |

For all three mechanical relay channels after a driver is installed:

```text
ESP32 GPIO LOW  -> relay S/IN = 0 V -> relay OFF -> COM-NC
ESP32 GPIO HIGH -> relay S/IN = 5 V -> relay ON  -> COM-NO
```

This is the opposite of the current direct active-LOW firmware configuration.
Update firmware safe boot levels and relay polarity to active HIGH before
connecting the drivers to GPIO 17, 18, and 19.

## Common 5 V Control Rail

For bench testing, laptop USB powers the ESP32 and LM2596 powers relay logic.
Do not connect LM2596 `OUT+` to ESP32 `VIN/5V` while USB is connected.

```text
12 V adapter -> LM2596 IN+ / IN-

LM2596 OUT+ (adjusted to 5.0 V) -> relay module VCC / +
                                    -> logic-driver VCC

LM2596 OUT-                       -> relay module GND / -
                                    -> logic-driver GND
                                    -> ESP32 GND

Laptop USB                         -> ESP32 micro-USB
```

All low-voltage grounds above must be common. The capacitor is parallel with
the rail, never in series:

```text
LM2596 OUT+ ----+---- 470 uF electrolytic positive
                +---- 100 nF ceramic

LM2596 OUT- ----+---- 470 uF electrolytic negative
                +---- 100 nF ceramic
```

Place a separate 100 nF ceramic capacitor directly beside each driver IC or
transistor-driver supply connection.

## Option A: 74HCT125 Buffer (Recommended)

Use one `74HCT125` or `74AHCT125` DIP-14 IC. Do not substitute `74HC125`.
HCT/AHCT accepts ESP32 3.3 V logic HIGH while powered from 5 V, then outputs a
stable 5 V HIGH to each relay input.

### Parts

```text
1x 74HCT125 or 74AHCT125 DIP-14
1x DIP-14 socket
1x 100 nF ceramic capacitor, marked 104
3x 10 kOhm resistors, GPIO boot pulldowns
```

### IC Connections

The standard DIP-14 pinout is:

```text
       +---\/---+
 /1OE  |1     14| VCC
  1A  |2     13| /4OE
  1Y  |3     12| 4A
 /2OE |4     11| 4Y
  2A  |5     10| /3OE
  2Y  |6      9| 3A
 GND  |7      8| 3Y
       +--------+
```

Wire the three required channels:

| Connection | Wire To |
| --- | --- |
| Pin 14 VCC | LM2596 5 V output |
| Pin 7 GND | common GND |
| 100 nF capacitor | directly between pins 14 and 7 |
| Pin 1 `/1OE` | GND, permanently enabled |
| Pin 2 `1A` | ESP32 GPIO 17 |
| Pin 3 `1Y` | pump relay `S/IN` |
| Pin 4 `/2OE` | GND, permanently enabled |
| Pin 5 `2A` | ESP32 GPIO 18 |
| Pin 6 `2Y` | mist relay `S/IN` |
| Pin 10 `/3OE` | GND, permanently enabled |
| Pin 9 `3A` | ESP32 GPIO 19 |
| Pin 8 `3Y` | fan relay `S/IN` |

Add one `10 kOhm` resistor from each input pin (`1A`, `2A`, `3A`) to GND.
These pulldowns keep each buffer output LOW and each relay OFF while ESP32 is
booting, resetting, or unpowered.

Leave the fourth buffer unused:

```text
Pin 13 /4OE -> 5 V (disabled)
Pin 12 4A  -> GND
Pin 11 4Y  -> not connected
```

### Functional Test

With relay load terminals empty:

```text
GPIO 17/18/19 LOW  -> matching S/IN approximately 0 V -> relay OFF
GPIO 17/18/19 HIGH -> matching S/IN approximately 5 V -> relay ON
```

The relay should click exactly once per state change. Repeated clicking means
stop and check 5 V, ground, pin numbering, and capacitor placement.

## Option B: BC547 + BC557 Discrete Driver

Use this only if a 74HCT125 is unavailable. Each relay channel needs one NPN
and one PNP transistor to produce a non-inverting 5 V output.

### Parts Per Channel

```text
1x BC547 NPN transistor (Q1)
1x BC557 PNP transistor (Q2)
1x 4.7 kOhm resistor, GPIO to Q1 base
1x 100 kOhm resistor, Q1 base pulldown
1x 10 kOhm resistor, Q2 base pullup
1x 10 kOhm resistor, relay S/IN pulldown
1x 100 nF ceramic capacitor across local 5 V and GND
```

Check the exact manufacturer's datasheet before wiring. Do not assume every
TO-92 package has the same collector-base-emitter order.

### One Channel Schematic

```text
                         +5 V
                           |
                      Q2 BC557 emitter
                           |
ESP32 GPIO --4.7k-- Q1 B   |   Q2 BC557 collector ---- relay S/IN
                  BC547    |                              |
                     E ----+---- GND                    10k
                     |                                    |
                    100k                                 GND
                     |
                    GND

Q1 collector ----+---- Q2 base
                 |
                10k
                 |
                +5 V
```

Detailed connections:

```text
Q1 BC547 emitter       -> common GND
ESP32 GPIO             -> 4.7 kOhm -> Q1 BC547 base
Q1 BC547 base          -> 100 kOhm -> common GND
Q1 BC547 collector     -> Q2 BC557 base
Q2 BC557 base          -> 10 kOhm -> 5 V
Q2 BC557 emitter       -> 5 V
Q2 BC557 collector     -> relay S/IN
relay S/IN             -> 10 kOhm -> common GND
100 nF ceramic         -> directly between 5 V and GND
```

Repeat the complete circuit for GPIO 17, 18, and 19.

### How It Works

```text
GPIO LOW:
  Q1 OFF, Q2 base pulled to 5 V, Q2 OFF, S/IN pulled to 0 V, relay OFF.

GPIO HIGH:
  Q1 ON, Q2 base pulled low, Q2 ON, S/IN driven near 5 V, relay ON.
```

## Relay Contact Wiring

After the driver has passed no-load tests, use normally-open contacts only:

```text
Supply positive -> correctly rated branch fuse -> relay COM
Relay NO        -> actuator positive
Actuator negative -> supply negative
Relay NC        -> not connected
```

Do not route pump, fan, mist-maker, or AC current through a solderless
breadboard.

| Load | Supply | Required Protection |
| --- | --- | --- |
| Pump | 12 V | fuse, and 10A10 flyback diode only if it is a brushed DC motor |
| Mist maker | 24 V | independent fuse; no generic flyback diode |
| Fan | use physical fan label | independent fuse; do not assume 12 V if label says 24 V |
| Growlight | AC | fuse on live conductor, insulated terminals/enclosure, never breadboard |

## SSR Control and Test

The SSR does not click. Its control-side validation is:

```text
GPIO 16 LOW  -> about 0 V -> SSR input LED OFF
GPIO 16 HIGH -> about 3.3 V -> SSR input LED ON
```

Use the serial actuator test command `1` to toggle GPIO 16. An SSR output
cannot be reliably checked in continuity or diode mode. Test its output only
with a correctly wired AC load outside the breadboard and with proper mains
safety measures.

## Firmware Requirement Before Connection

The production firmware currently treats GPIO 17, 18, and 19 as active-LOW
relay outputs. Both driver options in this document require active-HIGH
outputs:

```text
GPIO LOW  = mechanical relay OFF
GPIO HIGH = mechanical relay ON
```

Before connecting the drivers, update firmware so that boot safe state drives
GPIO 17, 18, and 19 LOW, and automatic logic treats HIGH as relay ON. Keep
GPIO 16 active HIGH for the SSR.

Do not attach real loads until this firmware change, no-load tests, and relay
contact tests all pass.

## Bench Test Sequence

1. Keep every COM, NO, NC, and SSR AC output terminal unloaded.
2. Verify LM2596 output is 5.0 V before connecting ESP32 or relay logic.
3. Connect common ground, driver supply, and one driver channel.
4. Use `actuator-test` firmware. Confirm one click per mechanical relay state
   change and no chatter for at least ten cycles.
5. Confirm relay contacts: OFF is COM-NC, ON is COM-NO.
6. Repeat for each channel.
7. Upload normal firmware with active-HIGH relay polarity before automatic
   sensor-control testing.
8. Add one real load at a time, using its correct supply and protection.

## Stop Conditions

Immediately remove power if any condition occurs:

```text
Repeated relay clicking or indicator flickering
ESP32 resets or unreadable serial output
LM2596 output outside 4.8-5.1 V
Hot component, smell, smoke, swollen capacitor
Any AC wiring on the breadboard
```
