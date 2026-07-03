# Dokumen 4: Panduan Tata Letak PCB Rev A (Layout Rules)

Panduan ini berisi aturan desain layout PCB 2-layer untuk modul kontrol utama Snowberry menggunakan EasyEDA Pro.

---

## 1. Zonasi PCB (Zoning Strategy)

Bagi area PCB menjadi 4 zona fisik yang terpisah untuk meminimalkan gangguan elektromagnetik (EMI) dan menjaga keselamatan:
1.  **Zona Tegangan Tinggi AC (High Voltage Zone):** Berisi terminal blok AC 220V dan SSR. Letakkan di tepi ujung kanan PCB.
2.  **Zona Tegangan Menengah DC (High Current DC Zone):** Berisi terminal blok input daya 12V/24V, terminal pompa, fan, mist, fuse holder, dan regulator LM2596.
3.  **Zona Logika & MCU (Logic MCU Zone):** Berisi modul ESP32 DevKitC, push-button, kapasitor decoupling, dan rangkaian voltage divider. Letakkan di tengah PCB.
4.  **Zona Tegangan Rendah & Sensor (Sensor Analog Zone):** Berisi terminal koneksi untuk sensor I2C (SHT30, BH1750) dan analog soil moisture. Letakkan di ujung kiri PCB, sejauh mungkin dari jalur AC dan beban motor.

---

## 2. Aturan Lebar Jalur Tembaga (Trace Width Guidelines)

Gunakan ketebalan tembaga standar **1 oz/ft² (35µm)** dengan lebar jalur sebagai berikut:

*   **Jalur Daya Pompa 12V & Input LM2596 (Arus hingga 5A peak):** Lebar jalur **minimum 2.5 mm (100 mil)** pada layer atas dan bawah (jika double layer paralel) atau gunakan copper pour.
*   **Jalur Daya Mist Maker 24V (Arus 1A):** Lebar jalur **1.0 mm (40 mil)**.
*   **Jalur Daya Logic 5V & 3.3V (Arus <500mA):** Lebar jalur **0.5 mm (20 mil)**.
*   **Jalur Sinyal Data & Sensor (SDA, SCL, Analog ADC):** Lebar jalur **0.254 mm (10 mil)**.

---

## 3. Strategi Grounding & Integritas Sinyal (Grounding & Shielding)

*   **Ground Plane:** Gunakan copper pour `GND` di seluruh area kosong layer bawah (Bottom Layer) sebagai ground plane.
*   **Split Ground (GND Pemisah):** Jangan campurkan ground sirkuit sensor analog dengan ground arus besar relay/pompa. Gunakan pemisahan jalur Ground analog (analog ground) dan Ground daya (power ground), kemudian hubungkan keduanya di satu titik tunggal (*Star Ground*) pada kaki kapasitor output LM2596.
*   **Jalur I2C:** Jalur SDA dan SCL harus dipasang berdampingan dengan ground trace di antaranya untuk mengurangi crosstalk. Panjang jalur I2C pada PCB diusahakan kurang dari 10 cm.

---

## 4. Penempatan Kapasitor Decoupling & Komponen Proteksi

*   **Kapasitor Decoupling (100nF):** Harus dipasang sedekat mungkin (kurang dari 5 mm) dari pin VCC sensor dan pin VIN ESP32. Jangan melewati via jika memungkinkan.
*   **Kapasitor Bulk (470µF):** Tempatkan tepat di dekat terminal output regulator LM2596 untuk meredam drop tegangan sesaat saat relay pompa menyala.
*   **Dioda Clamp (1N4148):** Tempatkan sangat dekat dengan pin GPIO 35 ESP32 untuk memotong lonjakan tegangan sebelum sempat masuk ke gerbang internal chip MCU.

---

## 5. Keamanan Tegangan Tinggi AC (AC Safety Clearance)

Jika terminal AC 220V dan SSR diletakkan pada PCB Rev A yang sama dengan sirkuit tegangan rendah:
*   **Jarak Isolasi (Clearance & Creepage):** Jarak fisik antara jalur tembaga AC 220V (Live/Neutral) dengan jalur tegangan rendah DC (GND, 5V, 3.3V) **wajib minimal 8.0 mm**.
*   **Slot Isolasi (Physical Isolation Slot):** Buat lubang udara (milling slot/cutout) selebar 2 mm pada PCB di bawah SSR untuk memutus kontinuitas papan FR4, mencegah arus bocor merambat akibat kelembapan udara greenhouse yang tinggi.
*   **Keepout Area:** Jangan tempatkan copper pour ground (GND plane) di bawah area sirkuit AC 220V. Area ini harus bersih dari tembaga di semua layer.

---

## 6. Silkscreen & Labeling yang Wajib Ada

Tulis label teks yang jelas pada tembaga/silkscreen untuk memudahkan perakitan dan maintenance petani:
*   Polaritas terminal input: tulis `+12V`, `+24V`, `GND` dengan ukuran huruf besar.
*   Terminal beban: beri label `POMPA 12V`, `KABUT 24V`, `KIPAS 12V`, `LAMPU AC`.
*   Arah kabel terminal: beri tanda panah arah kabel masuk.
*   Tanda bahaya AC: Tulis teks `AWAS TEGANGAN TINGGI / DANGER 220V AC` di dekat area SSR.

---

## 7. Titik Uji (Test Points) yang Wajib Disediakan

Pasang pin header tunggal (*Test Point*) pada titik-titik berikut untuk mempermudah pengecekan multimeter saat commissioning:

1.  `TP_3V3` : Titik ukur tegangan logika 3.3V.
2.  `TP_5V`  : Titik ukur tegangan logika 5.0V.
3.  `TP_12V` : Titik ukur tegangan rail 12.0V setelah sekring.
4.  `TP_24V` : Titik ukur tegangan rail 24.0V setelah sekring.
5.  `TP_GND` : Titik acuan Ground utama.
6.  `TP_VSENSE` : Titik ukur tegangan keluaran divider yang masuk ke GPIO 35.
7.  `TP_SDA` / `TP_SCL` : Untuk debugging bus I2C menggunakan logic analyzer.
8.  `TP_PUMP` / `TP_MIST` / `TP_FAN` : Titik ukur logika kendali relay sebelum masuk optocoupler.
