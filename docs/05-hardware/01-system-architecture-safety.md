# Dokumen 1: Arsitektur Sistem & Keselamatan Elektrik (Safety Design)

Dokumen ini mendefinisikan arsitektur kelistrikan, pembagian rel tegangan, proteksi transien, kalkulasi voltage divider, dan matriks kegagalan untuk proyek IoT Smart Greenhouse Snowberry 4-in-1.

---

## 1. Arsitektur Blok Kelistrikan (System Power Tree)

Sistem Snowberry menggunakan konfigurasi **Tiga Adaptor Terpisah (Triple Power Source)** untuk menjamin isolasi kelistrikan antara beban induktif DC (pompa), beban ultrasonik (mist maker), dan rangkaian logika kontrol (ESP32 & sensor).

```
[AC Mains 220V] ──┬──→ [Adaptor 12V DC 8A] ──→ 12V Rail (Pompa, Fan, LM2596 Input)
                  ├──→ [Adaptor 24V DC 1A] ──→ 24V Rail (Ultrasonic Mist Maker)
                  └──→ [SSR G3MB-202P] ─────→ AC Load (Lampu Growlight 220V AC)

[12V Rail] ──→ [LM2596 Buck Regulator] ──→ 5V Rail (Power Input ESP32 VIN & Relay Coils)
[ESP32 Board] ─(Onboard AMS1117-3.3)──→ 3.3V Rail (Sensor I2C, ADC Reference, Pull-up)
```

### A. Blok ESP32 (Microcontroller Unit)
*   **Otak Kontrol:** ESP32-WROOM-32D (DevKitC V4).
*   **Sumber Tegangan:** 5.0V input pada pin `VIN` (diregulasi oleh buck converter LM2596 dari 12V rail).
*   **Tegangan Logika & Sensor:** 3.3V dari output regulator internal ESP32 (AMS1117-3.3) untuk menyuplai pin sensor SHT30, BH1750, dan sensor soil.
*   **GPIO Safe-State:** Dilindungi melalui resistor pembatas arus seri (220Ω) pada pin kendali relay untuk mencegah beban berlebih (overcurrent) pada GPIO ESP32.

### B. Blok Sensor (3.3V logic)
*   **I2C Bus:** SHT30-D (Suhu & RH) dan BH1750 (Lux) terhubung ke SCL (GPIO 22) dan SDA (GPIO 21). pull-up resistor 4.7kΩ dipasang ke rail 3.3V.
*   **Soil Moisture:** Sensor Kapasitif V2.0 terhubung ke GPIO 34 (ADC1_CH6). Suplai daya 3.3V dari regulator internal ESP32.
*   **Power Monitor:** Voltage divider terhubung dari 12V rail (setelah fuse) ke GPIO 35 (ADC1_CH7).

### C. Blok Aktuator (Relay & SSR)
Semua aktuator diisolasi secara optis (Optocoupler) untuk memisahkan sirkuit logika MCU dengan sirkuit daya beban.
1.  **Lampu Growlight (AC 220V):** Dikendalikan oleh Solid State Relay (SSR) G3MB-202P (Active-HIGH, GPIO 16).
2.  **Pompa Air 12V (DC Induktif):** Dikendalikan oleh relay mekanik (Active-LOW, GPIO 17).
3.  **Mist Maker 24V (Ultrasonic Disc):** Dikendalikan oleh relay mekanik (Active-LOW, GPIO 18).
4.  **Kipas Humidifier 12V (DC Fan):** Dikendalikan oleh relay mekanik (Active-LOW, GPIO 19).

---

## 2. Manajemen Grounding (Common GND Strategy)

*   **Penyatuan GND:** Semua titik Ground (`GND` Adaptor 12V, `VIN-` LM2596, `OUT-` LM2596, `GND` ESP32, dan `GND` Adaptor 24V) **WAJIB** dihubungkan bersama menjadi satu simpul Ground utama (**Common GND**).
*   **Loop Ground:** Untuk mencegah ground loop noise yang dapat mengacaukan pembacaan ADC (sensor tanah dan monitor tegangan), layout GND menggunakan topologi *Star Connection* (Pusat titik Ground berada pada pin `GND` kapasitor output LM2596).
*   **Isolasi AC:** Ground sirkuit low-voltage DC **tidak boleh** terhubung ke kabel AC Neutral atau AC Earth (Mains 220V) untuk mencegah kecelakaan sengatan listrik jika terjadi kegagalan SSR.

---

## 3. Kalkulasi Voltage Divider & Proteksi ADC (12V Rail Monitor)

Pencabutan adaptor 12V utama dapat merusak pompa/fan, sementara ESP32 tetap menyala beberapa detik menggunakan sisa daya kapasitor. Sistem memonitor tegangan ini menggunakan pembagi tegangan resistor dan dioda clamp.

### A. Perhitungan Resistor
Berdasarkan sediaan resistor, dipasang konfigurasi seri $20\,\text{k}\Omega + 10\,\text{k}\Omega$ pada bagian atas (R_upper = $30\,\text{k}\Omega$) dan resistor $10\,\text{k}\Omega$ pada bagian bawah (R_lower).
$$\text{V}_{\text{ADC}} = \text{V}_{\text{rail}} \times \left( \frac{\text{R}_{\text{lower}}}{\text{R}_{\text{upper}} + \text{R}_{\text{lower}}} \right) = \text{V}_{\text{rail}} \times \left( \frac{10\,\text{k}\Omega}{30\,\text{k}\Omega + 10\,\text{k}\Omega} \right) = \frac{\text{V}_{\text{rail}}}{4}$$

*   **Tegangan Nominal (12.0V):** $\text{V}_{\text{ADC}} = 3.00\,\text{V}$ (Di bawah batas ADC ESP32 3.3V. Aman).
*   **Tegangan Maksimum Adaptor (+10% / 13.2V):** $\text{V}_{\text{ADC}} = 3.30\,\text{V}$ (Tepat di batas atas rentang input ADC ESP32).
*   **Tegangan Lonjakan/Overvoltage (+15% / 13.8V):** Tanpa proteksi, $\text{V}_{\text{ADC}}$ akan mencapai $3.45\,\text{V}$, yang dapat merusak GPIO ESP32.

### B. Proteksi Dioda Clamp (1N4148)
*   **Pemasangan:** Anode terhubung ke pin ADC (GPIO 35), Cathode terhubung ke rail 3.3V ESP32.
*   **Fungsi:** Jika tegangan ADC melebihi $3.3\,\text{V} + \text{V}_f$ (di mana forward voltage $\text{V}_f \approx 0.3\,\text{V}$), dioda akan konduktif dan membuang kelebihan tegangan ke rail 3.3V.
*   **Hasil:** Tegangan pin GPIO 35 di-clamp di nilai maksimum $3.6\,\text{V}$ (batas absolut ESP32).

---

## 4. Proteksi Beban & Fusing (Safety Fuses & Diodes)

Beban DC induktif dan ultrasonik wajib diproteksi terhadap arus berlebih dan tegangan balik (*back-EMF*).

### A. Fuse (Sekring) Pengaman Jalur
*   **Jalur Utama 12V (Beban Motor Pompa & Fan):** **Fuse 7A Slow-Blow** (F1) dipasang seri setelah jack input 12V. Alasan: Pompa menarik arus start-up (*inrush current*) hingga 5A, arus normal ~3A. Slow-blow mencegah sekring putus akibat lonjakan start-up awal.
*   **Jalur Utama 24V (Mist Maker):** **Fuse 1A Fast-Blow** (F2) dipasang seri setelah jack input 24V. Alasan: Mist maker ultrasonik bersifat resistif/kapasitif berarus konstan ~500-800mA. Fast-blow langsung memutus sirkuit jika transduser mengalami hubungan singkat (*short*).

### B. Dioda Flyback (Flyback Diode)
*   **Komponen:** Dioda arus tinggi **10A10** (10A, 1000V) dipasang paralel-terbalik (*reverse-parallel*) langsung di terminal beban Pompa Air 12V.
*   **Polaritas:** Cathode (sisi bergaris putih) dihubungkan ke terminal positif pompa (+12V), Anode dihubungkan ke terminal negatif pompa (GND).
*   **Fungsi:** Menyerap lonjakan tegangan tinggi induktif (*back-EMF*) hingga ratusan volt saat relay pompa dimatikan. Mencegah percikan api pada kontak relay mekanik dan interferensi EMI pada ESP32.

---

## 5. Matriks Pengoperasian & Logika Kegagalan Aktuator (Safety Matrix)

| Kondisi Kegagalan | Lampu Growlight AC | Pompa Air 12V | Mist Maker 24V | Kipas Humidifier 12V | Tindakan Sistem & Pesan UI |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Boot Awal / Reset ESP32** | **OFF** | **OFF** | **OFF** | **OFF** | Latch register GPIO diatur sebelum inisialisasi. Semua pin OFF. |
| **Sensor Temp/RH SHT30 Putus** | Tidak Terpengaruh | Tidak Terpengaruh | **OFF** | **OFF** | Kipas dan mist dimatikan demi keselamatan. Fault: `SHT30_ERROR`. |
| **Sensor Lux BH1750 Putus** | **OFF** | Tidak Terpengaruh | Tidak Terpengaruh | Tidak Terpengaruh | Lampu tanam dimatikan untuk cegah DLI berlebih. Fault: `BH1750_ERROR`. |
| **Sensor Soil Moisture Lepas** | Tidak Terpengaruh | **OFF** | Tidak Terpengaruh | Tidak Terpengaruh | Pompa otomatis dikunci OFF agar tidak banjir. Fault: `SOIL_SENSOR_ERROR`. |
| **Sensor Soil Belum Dikalibrasi** | Tidak Terpengaruh | **OFF** | Tidak Terpengaruh | Tidak Terpengaruh | Pompa otomatis dikunci OFF. Fault: `SOIL_CALIBRATION_MISSING`. |
| **Tegangan 12V Rail Drop (<10V)** | Tidak Terpengaruh | **OFF** | Tidak Terpengaruh | **OFF** | Kipas & pompa dimatikan agar PSU tidak overload. Fault: `PSU_VOLTAGE_LOW`. |
| **NVS Memory Korupsi (Corrupted)** | Mengikuti Default | **OFF** | Mengikuti Default | Mengikuti Default | Pompa dinonaktifkan (karena nilai kalibrasi hilang). Fault: `NVS_ERROR`. |
| **Command Manual Expired (30 mnt)** | Auto Resume | Auto Resume | Auto Resume | Auto Resume | Logika kontrol mengambil alih kembali secara otomatis. |
