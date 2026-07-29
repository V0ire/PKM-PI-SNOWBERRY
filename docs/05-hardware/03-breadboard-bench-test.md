# Dokumen 3: Panduan Pengujian Meja & Simulasi Breadboard (Bench Test Guide)

Panduan ini berisi metode langkah-demi-langkah untuk melakukan pengujian sirkuit Snowberry menggunakan breadboard sebelum dilakukan perakitan PCB atau instalasi di lapangan.

---

## 1. Alat & Bahan Uji Aman (Safety Gear)
*   **Multimeter Digital:** Untuk uji kontinuitas dan pembacaan tegangan.
*   **LED 5mm Merah/Kuning & Resistor 1kΩ:** Sebagai simulator beban (pengganti beban AC 220V dan pompa 12V).
*   **Obeng Kecil & Kabel Jumper.**
*   **Power Supply DC / Adaptor Uji (12V & 24V).**

---

## 2. Langkah Pengujian Bertahap (Step-by-Step Testing)

### Tahap 1: Pengujian ESP32 Saja (Microcontroller Sanity Check)
1.  Hubungkan ESP32 DevKitC ke komputer menggunakan kabel USB micro-B.
2.  Ukur tegangan pada pin `3V3` terhadap `GND` menggunakan multimeter. Nilai terukur **harus** berkisar antara $3.25\,\text{V}$ hingga $3.35\,\text{V}$.
3.  Flash firmware local-first Snowberry yang telah dibuat.
4.  Buka Serial Monitor pada baud rate `115200`. Pastikan log awal muncul:
    `[boot] Semua aktuator OFF (safe-state).`

### Tahap 2: Pengujian I2C Bus & Sensor
1.  Cabut kabel USB. Hubungkan modul sensor SHT30 dan BH1750 pada breadboard.
2.  Sambungkan pin SDA (GPIO 21) dan SCL (GPIO 22) ke pin data sensor. Hubungkan VCC sensor ke pin 3.3V ESP32 dan GND ke GND ESP32.
3.  Colokkan kembali USB. Pastikan tidak ada kegagalan I2C.
4.  Buka Serial Monitor dan perhatikan data pembacaan sensor:
    *   Suhu (Temperature_c): pastikan bernilai riil (sekitar $24^\circ\text{C}$ hingga $30^\circ\text{C}$).
    *   Kelembapan udara (Humidity_pct): pastikan bernilai riil ($50\%$ hingga $90\%$).
    *   Cahaya (Lux): tutup sensor untuk memastikan pembacaan turun ke mendekati 0 lux.

### Tahap 3: Verifikasi Voltage Divider (12V Rail Monitor)
1.  Uji rangkaian pembagi tegangan ($30\,\text{k}\Omega + 10\,\text{k}\Omega$) pada breadboard **tanpa** menghubungkannya ke pin ESP32 terlebih dahulu.
2.  Hubungkan input divider ke adaptor 12V. Hubungkan GND adaptor ke GND breadboard.
3.  Ukur titik tengah divider (node `VSENSE_ANALOG`) menggunakan multimeter terhadap GND.
    *   Tegangan terukur **wajib** bernilai $\approx 3.00\,\text{V}$ (toleransi resistor $\pm 5\%$, kisaran aman $2.85\,\text{V} - 3.15\,\text{V}$).
    *   **Peringatan:** Jika multimeter membaca tegangan di atas $3.4\,\text{V}$ (misal karena salah nilai resistor atau resistor bawah tidak menempel di GND), **JANGAN** hubungkan pin ke GPIO 35. Cari kesalahan rangkaian terlebih dahulu.
4.  Jika tegangan aman, hubungkan node tersebut ke GPIO 35 dan verifikasi nilai `PSU Voltage` di Serial Monitor menunjukkan $\approx 12.0\,\text{V}$.

### Tahap 4: Pengujian Simulator Aktuator (LED Simulation)
Untuk keselamatan, **jangan** hubungkan pompa air 12V atau growlight AC 220V ke breadboard. Gunakan LED + resistor 1kΩ sebagai simulator.
1.  Hubungkan LED merah ke GPIO 16 (Growlight, Active-HIGH) dengan resistor 1kΩ seri ke GND.
2.  Hubungkan LED kuning ke GPIO 17 (Pump, Active-LOW) dengan resistor 1kΩ seri ke 3.3V/5V.
3.  Hubungkan LED hijau ke GPIO 18 dan 19 (Mist & Fan, Active-LOW) dengan resistor 1kΩ seri ke 3.3V/5V.
4.  Nyalakan ESP32. Amati behavior saat boot:
    *   Semua LED **harus tetap mati** saat kabel daya pertama colok. Tidak boleh ada kilatan cahaya (*blink*) sesaat.
5.  Uji transisi logika dengan mengubah threshold via Serial / simulasi sensor:
    *   Turunkan lux (tutup BH1750) -> LED Growlight menyala.
    *   Naikkan suhu / RH -> LED Fan menyala.
    *   Turunkan RH -> LED Mist menyala. LED Fan mati (konflik resolved).
    *   Masukkan sensor tanah ke gelas air (analog ADC drop) -> LED Pompa mati.

### Tahap 5: Pengujian Driver Relay Asli (Beban Aman)
Setelah simulasi LED berhasil, hubungkan modul relay DC 5V fisik ke breadboard.
1.  Gunakan adaptor 12V untuk menyuplai pin VCC modul relay jika koil membutuhkan 12V, atau gunakan rail 5V jika koil 5V.
2.  Amati suara klik saat logika kontrol aktif.
3.  Uji ketahanan transien: nyalakan dan matikan relay berulang kali (setiap 2 detik) selama 10 menit. ESP32 **tidak boleh mengalami restart** (jika restart, kapasitor decoupling $100\,\text{nF}$ atau kapasitor bulk $470\,\mu\text{F}$ tidak terpasang dengan baik).

### Tahap 6: Pengujian Beban Induktif Asli (Pompa & Mist Maker)
1.  Hubungkan Pompa Air 12V ke terminal output relay. 
2.  **Sangat Penting:** Pasang dioda flyback 10A10 melintang di terminal pompa (Cathode di pin +, Anode di pin -).
3.  Lakukan penyiraman bertahap (pulse + soak). Amati pipa output mengeluarkan air tanpa ada gangguan EMI pada layar Serial Monitor.

### Tahap 7: Pengujian Growlight AC 220V (Fase Terakhir & Berbahaya)
1.  Tempatkan modul SSR G3MB-202P di dalam kotak panel plastik terisolasi.
2.  Gunakan terminal sekrup terisolasi untuk jalur AC 220V.
3.  Hubungkan Growlight AC ke terminal output SSR.
4.  Lakukan pengujian hanya setelah memastikan tidak ada kabel tembaga AC yang terkelupas atau menyentuh bagian sirkuit tegangan rendah DC.

---

## 3. Checklist Validasi Skenario Kegagalan (Fail-Safe Verification)

| No. | Skenario Pengujian | Hasil yang Diharapkan | Status |
| :--- | :--- | :--- | :---: |
| 1 | **Safe Boot Test** | Matikan dan hidupkan ESP32 sebanyak 10 kali. Amati relay pompa. Relay **sama sekali tidak boleh berbunyi klik** saat boot. | [ ] |
| 2 | **Sensor Disconnect (SHT30)** | Saat fan/mist menyala, cabut pin SDA/SCL sensor SHT30. Mist Maker dan Fan **harus langsung mati (OFF)** dalam waktu <2 detik. Serial Monitor menampilkan fault `SHT30_ERROR`. | [ ] |
| 3 | **Sensor Disconnect (Soil)** | Saat pompa sedang menyiram (pulse ON), cabut kabel sinyal sensor tanah. Pompa **harus langsung mati (OFF)**. Serial Monitor menampilkan fault `SOIL_SENSOR_ERROR`. | [ ] |
| 4 | **WiFi Offline Test** | Matikan router WiFi. ESP32 **harus tetap melanjutkan siklus pembacaan dan kontrol lokal** secara mandiri menggunakan threshold terakhir di NVS. Rangkaian tidak boleh hang atau terhambat loop reconnecting. | [ ] |
| 5 | **Manual Command Expiry** | Kirim manual command ON pompa. Cabut kabel internet router (NTP offline). Pompa **harus mati kembali secara otomatis** setelah 30 menit berakhir (millis fallback). | [ ] |
| 6 | **Voltage Sag Test** | Turunkan tegangan supply adaptor 12V menjadi di bawah 10V menggunakan labbench power supply. Pompa dan Fan **harus otomatis OFF**. Serial Monitor menampilkan fault `PSU_VOLTAGE_LOW`. | [ ] |
