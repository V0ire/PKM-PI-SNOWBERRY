# Dokumen 5: Daftar Periksa Order & Commissioning (Pre-Order & Commissioning Checklist)

Dokumen ini berisi daftar verifikasi sebelum mengirimkan file Gerber ke produsen PCB, serta panduan pengujian fisik setelah board hasil pabrikasi tiba.

---

## 1. Daftar Periksa Sebelum Order PCB (Pre-Order Checklist)

Lakukan pemeriksaan ini secara manual di EasyEDA Pro sebelum melakukan eksport file Gerber:

- [ ] **Electrical Rules Check (ERC) Pass:** Tidak ada pin input mengambang (*floating*), pin output yang terhubung singkat (*shorted*), atau pin tanpa sambungan daya yang tidak disengaja.
- [ ] **Design Rules Check (DRC) Pass:** 
  *   Clearance minimum $0.2\,\text{mm}$ (8 mil) untuk jalur sinyal tegangan rendah.
  *   Clearance minimum $8.0\,\text{mm}$ antara sirkuit AC 220V dan DC tegangan rendah.
  *   Lebar track daya minimum sesuai dengan spesifikasi ($2.5\,\text{mm}$ untuk 12V Pompa).
- [ ] **Footprint Check (Terminal Block & Relay):**
  *   Pitch terminal blok yang digunakan bernilai tepat $5.08\,\text{mm}$, bukan pitch $3.81\,\text{mm}$ atau $2.54\,\text{mm}$.
  *   Lubang pin terminal blok cukup besar untuk memasukkan kabel serabut $0.75\,\text{mm}^2$.
  *   Footprint relay mekanik 5V dan SSR G3MB sesuai dengan dimensi komponen fisik yang telah dibeli.
- [ ] **Polaritas Dioda & Kapasitor:**
  *   Garis cathode dioda flyback (10A10 & 1N4007) dan dioda clamp (1N4148) tergambar dengan benar di silkscreen layer atas.
  *   Tanda positif (+) untuk kapasitor elektrolitik bulk $470\,\mu\text{F}$ tergambar jelas dan tidak terbalik polaritasnya.
- [ ] **Verification of Voltage Divider Nodes:**
  *   Resistor $20\,\text{k}\Omega$ terhubung langsung ke rel `+12V` (setelah sekring).
  *   Resistor $10\,\text{k}\Omega$ terhubung ke GND.
  *   Kapasitor filter $100\,\text{nF}$ paralel dengan resistor $10\,\text{k}\Omega$.
- [ ] **Fuses:**
  *   Sekring daya terpasang seri pada jalur daya input sebelum komponen regulator atau aktuator.
- [ ] **Gerber Viewer Inspection:**
  *   Periksa area copper pour GND di Gerber viewer, pastikan tidak ada area tembaga mengambang (*isolated copper islands*) yang tidak terhubung ke GND utama.
  *   Periksa kejelasan tulisan silkscreen pada layer atas dan bawah, pastikan tidak ada teks yang menumpuk di atas pad solder.

---

## 2. Daftar Periksa Commissioning Setelah PCB Tiba (Post-Delivery Checklist)

Lakukan prosedur ini secara berurutan **sebelum** memasang alat di greenhouse petani:

### Tahap A: Pengujian Pasif (Cold/Continuity Test)
*Lakukan pengujian ini tanpa menghubungkan sumber daya apa pun ke board.*
- [ ] **Short Circuit Test:** Ukur hambatan antara rel daya utama menggunakan multimeter skala Ohm/Kontinuitas:
  *   `+12V` terhadap `GND` (Hambatan harus bernilai mega-Ohm, tidak boleh bunyi bip/short).
  *   `+24V` terhadap `GND` (Tidak boleh bip/short).
  *   `+5V` terhadap `GND` (Tidak boleh bip/short).
  *   `+3V3` terhadap `GND` (Tidak boleh bip/short).
- [ ] **Ground Continuity Test:** Pastikan seluruh pin GND pada terminal blok, ESP32, LM2596, dan sensor terhubung secara fisik (multimeter harus berbunyi bip).

### Tahap B: Pengujian Daya Pertama (Power-Up tanpa ESP32)
*Pasang adaptor daya tetapi JANGAN pasang modul ESP32 pada socket-nya.*
- [ ] Colokkan adaptor 12V ke terminal input.
- [ ] Atur potensiometer LM2596 hingga multimeter membaca **tepat 5.00V** pada terminal output regulator LM2596.
- [ ] Ukur pin socket ESP32 (pin `VIN` / 5V) dan pastikan tegangannya bernilai $5.00\,\text{V}$.
- [ ] Ukur output divider tegangan di pin socket ESP32 (pin GPIO 35). Tegangan terukur **harus bernilai 3.00V** (toleransi $\pm 0.15\,\text{V}$).

### Tahap C: Pengujian Logika (Power-Up dengan ESP32)
*Cabut daya, pasang ESP32 ke socket, pasang sensor I2C dan soil.*
- [ ] Colokkan daya USB / adaptor. Amati modul ESP32: pastikan tidak ada asap, bau terbakar, atau panas berlebih pada chip regulator internal.
- [ ] Sambungkan Serial Monitor. Pastikan log mendeteksi semua sensor dalam kondisi sehat.
- [ ] Uji kalibrasi sensor tanah (ambil `adc_dry` di udara terbuka, ambil `adc_wet` di air). Simpan nilai kalibrasi ke NVS dengan menekan tombol.

### Tahap D: Pengujian Aktuator Bertahap (Beban Nyata)
*Hubungkan beban nyata satu per satu.*
- [ ] **Uji Pompa Air 12V:** Hubungkan pompa air 12V. Jalankan penyiraman otomatis. Pastikan pompa menyiram secara berdenyut (*pulse*) dan berhenti (*soak*) tanpa mengacaukan pembacaan ADC sensor tanah.
- [ ] **Uji Reboot Stress Test:** Hidupkan ulang (reboot) ESP32 menggunakan tombol reset sebanyak 20 kali secara berturut-turut. Amati beban pompa dan mist maker: **tidak boleh terjadi getaran relay atau aktuator menyala sesaat** selama proses booting.
- [ ] **Uji WiFi & Cloud Lost:** Cabut kabel antena/daya router WiFi saat pompa sedang menyiram. Pompa **harus menyelesaikan siklus penyiramannya dan mati dengan aman** mengikuti keputusan kontrol lokal ESP32.
- [ ] **Uji Sensor Putus:** Saat pompa menyiram, cabut kabel sensor tanah. Pompa **wajib langsung mati seketika** untuk menghindari over-watering akibat hilangnya data sensor.
