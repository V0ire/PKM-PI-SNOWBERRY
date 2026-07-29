# Dokumen 2: Panduan Skematik EasyEDA Pro (Schematic Guide)

Dokumen ini adalah instruksi langkah-demi-langkah untuk menggambar skematik sirkuit kontrol Snowberry Smart Greenhouse di software EasyEDA Pro.

---

## 1. Pembagian Lembar Skematik (Sheet Breakdown)

Untuk skema kontrol Rev A, disarankan membagi skematik menjadi 3 halaman (sheets) guna mempermudah pembacaan dan pelacakan sinyal:
*   **Sheet 1: MCU & Logic Connections** (ESP32 DevKitC, Button, Sensor Interfaces, I2C Pull-ups).
*   **Sheet 2: Power Rails & Regulation** (Fuses, DC Input Jack, LM2596 Buck Regulator, Decoupling, Voltage Divider, Clamp).
*   **Sheet 3: Actuator Interfaces** (Optocoupler Isolators, Relay Coils, NPN Transistors, SSR AC Terminals).

---

## 2. Penamaan Jaringan Kabel (Net Names)

Gunakan pelabelan jaringan (*Net Label*) berikut secara konsisten di seluruh lembar skematik agar terhubung otomatis saat layout PCB:

### A. Power Nets
*   `+12V_RAW` : Jalur positif input 12V langsung dari adaptor DC (sebelum sekring).
*   `+12V`     : Jalur positif 12V yang sudah melewati sekring (menyuplai pompa, fan, input LM2596).
*   `+24V_RAW` : Jalur positif input 24V langsung dari adaptor DC (sebelum sekring).
*   `+24V`     : Jalur positif 24V yang sudah melewati sekring (menyuplai mist maker).
*   `+5V`      : Jalur positif 5V dari output regulator LM2596 (menyuplai ESP32 pin VIN dan koil relay).
*   `+3V3`     : Jalur positif 3.3V dari regulator internal ESP32 (menyuplai sensor, reference voltage).
*   `GND`      : Ground bersama (Common Ground) untuk seluruh rel tegangan DC.

### B. Control Logic Nets
*   `SDA`      : Sinyal data I2C (GPIO 21).
*   `SCL`      : Sinyal clock I2C (GPIO 22).
*   `SOIL_ANALOG` : Input analog sensor kelembapan tanah (GPIO 34).
*   `VSENSE_ANALOG` : Input analog pembacaan tegangan 12V rail (GPIO 35).
*   `CTRL_GROWLIGHT` : Sinyal pemicu SSR Growlight (GPIO 16).
*   `CTRL_PUMP` : Sinyal pemicu Relay Pompa (GPIO 17).
*   `CTRL_MIST` : Sinyal pemicu Relay Mist Maker (GPIO 18).
*   `CTRL_FAN`  : Sinyal pemicu Relay Fan Humidifier (GPIO 19).
*   `CAL_BUTTON` : Input pembacaan tombol push-button (GPIO 4).

---

## 3. Pemetaan Pin Lengkap (Pin Mapping Matrix)

Hubungkan pin ESP32 DevKitC V4 ke komponen eksternal menggunakan tabel di bawah:

| Pin ESP32 | Net Name | Koneksi Komponen | Mode GPIO | Polaritas / Fungsi |
| :--- | :--- | :--- | :--- | :--- |
| **GND** | `GND` | Ground kapasitor LM2596 & Terminal GND | Power Ground | Common Ground |
| **5V / VIN** | `+5V` | Output VOUT+ LM2596 | Power Input | Suplai Daya ESP32 |
| **3V3** | `+3V3` | Sensor VCC, Dioda Clamp Cathode | Power Output | Suplai Sensor & Pull-up |
| **GPIO 21** | `SDA` | Pin SDA SHT30 & BH1750 | Digital I/O | I2C Data (Pull-up 4.7kΩ ke 3.3V) |
| **GPIO 22** | `SCL` | Pin SCL SHT30 & BH1750 | Digital Output | I2C Clock (Pull-up 4.7kΩ ke 3.3V) |
| **GPIO 34** | `SOIL_ANALOG` | Pin Signal Sensor Soil Moisture | Analog Input | ADC1_CH6 (Rentang 0-3.3V) |
| **GPIO 35** | `VSENSE_ANALOG`| Output Voltage Divider | Analog Input | ADC1_CH7 (Rentang 0-3.0V) |
| **GPIO 16** | `CTRL_GROWLIGHT`| Resistor Seri 220Ω → Pin SSR | Digital Output | Active-HIGH (HIGH=ON, LOW=OFF) |
| **GPIO 17** | `CTRL_PUMP` | Resistor Seri 220Ω → Opto Relay | Digital Output | Active-LOW (LOW=ON, HIGH=OFF) |
| **GPIO 18** | `CTRL_MIST` | Resistor Seri 220Ω → Opto Relay | Digital Output | Active-LOW (LOW=ON, HIGH=OFF) |
| **GPIO 19** | `CTRL_FAN` | Resistor Seri 220Ω → Opto Relay | Digital Output | Active-LOW (LOW=ON, HIGH=OFF) |
| **GPIO 4** | `CAL_BUTTON` | Push Button ke GND | Digital Input | Pull-up internal aktif, debounce cap 100nF |

---

## 4. Skema Rincian per Bagian (Sub-circuit Schematics)

### A. Blok Regulator & Sensor Tegangan (Sheet 2)
1.  **DC Input Terminal:** Screw Terminal pitch 5.08mm 2-pin untuk input 12V dan 24V.
2.  **Fuse Holders:** Pasang simbol fuse `F1` (7A) seri pada `+12V_RAW` dan `F2` (1A) seri pada `+24V_RAW`.
3.  **Buck Converter (LM2596):**
    *   `VIN+` terhubung ke `+12V` (setelah sekring).
    *   `VIN-` terhubung ke `GND`.
    *   `VOUT-` terhubung ke `GND`.
    *   `VOUT+` terhubung ke `+5V`.
    *   Pasang Kapasitor Elektrolitik Bulk 470µF/25V paralel pada `VOUT+` dan `VOUT-` untuk menekan ripple saat relay aktif.
4.  **Divider Tegangan & Dioda Proteksi:**
    *   Resistor `R1` (20kΩ) terhubung ke `+12V`.
    *   Resistor `R2` (10kΩ) terhubung seri dari kaki bawah `R1` ke `VSENSE_ANALOG`.
    *   Resistor `R3` (10kΩ) terhubung dari `VSENSE_ANALOG` ke `GND` (R2 + R3 seri membentuk R_lower = 10kΩ).
    *   Kapasitor filter `C4` (100nF) dipasang paralel dengan `R3` (dari `VSENSE_ANALOG` ke `GND`).
    *   Dioda Clamp `D1` (1N4148): Anode terhubung ke `VSENSE_ANALOG`, Cathode terhubung ke `+3V3`.

### B. Blok Aktuator (Sheet 3)
1.  **Lampu Growlight AC 220V (SSR):**
    *   Input: `CTRL_GROWLIGHT` dihubungkan ke resistor pembatas arus 220Ω, lalu masuk ke pin Input (+) SSR G3MB-202P. Input (-) SSR terhubung ke `GND`.
    *   Output: Pin Output Load SSR terhubung seri dengan sekring AC (1A) ke Terminal Blok AC 3-pin (AC_Live, AC_Neutral, AC_Earth).
2.  **Relay DC Active-Low (Pompa, Fan, Mist):**
    *   Gunakan isolasi optocoupler (misal chip PC817).
    *   Anode LED internal optocoupler terhubung ke `+5V` melalui resistor pull-up 1kΩ.
    *   Cathode LED internal terhubung ke pin kontrol ESP32 (`CTRL_PUMP`, `CTRL_MIST`, `CTRL_FAN`).
    *   Sisi output transistor optocoupler menyalakan transistor NPN (misal BC547) untuk men-drive koil relay mekanik 5V.
    *   Pasang dioda freewheeling (1N4007) paralel-terbalik pada kaki koil relay untuk meredam arus balik koil.
    *   **Penting:** Dioda flyback berdaya besar (10A10) dipasang secara fisik langsung di terminal luar tempat kabel Pompa Air 12V dicolokkan.

---

## 5. Pemetaan Terminal Output (Terminal Block Mapping)

Gunakan terminal blok dengan pitch 5.08mm berkemampuan arus minimum 10A untuk koneksi kabel luar:

*   **TB1 (Power Input DC):**
    *   Pin 1: `+12V_RAW` (Input Adaptor 12V)
    *   Pin 2: `+24V_RAW` (Input Adaptor 24V)
    *   Pin 3: `GND` (Common Ground)
*   **TB2 (Pompa Air 12V):**
    *   Pin 1: `+12V` (Fused supply)
    *   Pin 2: Drain/Kolektor Relay Pompa (Kembali ke GND jika relay aktif)
    *   *Catatan:* Dioda flyback 10A10 dipasang melintang di pin 1 (Cathode) dan pin 2 (Anode) terminal ini.
*   **TB3 (Mist Maker 24V):**
    *   Pin 1: `+24V` (Fused supply)
    *   Pin 2: Kolektor Relay Mist (Kembali ke GND jika relay aktif)
*   **TB4 (Kipas Humidifier 12V):**
    *   Pin 1: `+12V` (Fused supply)
    *   Pin 2: Kolektor Relay Fan (Kembali ke GND jika relay aktif)
*   **TB5 (Growlight AC 220V):**
    *   Pin 1: AC Live (Melewati kontak SSR)
    *   Pin 2: AC Neutral
    *   Pin 3: AC Earth (Terhubung langsung ke chasis logam box panel)
