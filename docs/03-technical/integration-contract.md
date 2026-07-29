# Snowberry — Kontrak Integrasi Device ↔ Firestore (v1.0)

| Field | Value |
| --- | --- |
| Status | CANON — mengikat semua model eksekutor |
| Tanggal | 2026-07-05 |
| Basis | `api-contract.md` v1.0 + firmware host-tested + `firebase/firestore.rules` |
| Prioritas konflik | Dokumen INI menang atas `api-contract.md` untuk poin yang ditandai **[AMANDEMEN]** |

Aturan baca untuk model eksekutor:
- Nama field CASE-SENSITIVE persis seperti tertulis. Dilarang menambah/mengganti nama.
- Semua timestamp bertipe number = Unix epoch **milidetik** (bukan detik).
- "Device" = ESP32 asli ATAU simulator Node.js. Keduanya WAJIB berperilaku identik terhadap kontrak ini.
- Path Firestore HANYA yang tercantum di sini. Dilarang membuat koleksi baru.

---

## A. KONTRAK INTEGRASI

### A0. Identitas & Amandemen Terhadap api-contract.md

| # | Amandemen | Alasan |
| --- | --- | --- |
| 1 | **Auth device = akun Firebase Auth terpisah** (bukan kredensial owner seperti api-contract §8) | Least-privilege; device tidak boleh bisa menulis config. Rules kanon = `firebase/firestore.rules` (role `device`). |
| 2 | **Command polling = 10 s** (bukan 5 s) | Hemat 50% read quota (8.640/hari vs 17.280/hari). |
| 3 | **Threshold polling = 60 s** (bukan 30 s) | 1.440 read/hari cukup; config jarang berubah. |
| 4 | **`status/realtime` diperluas**: blok `command_ack`, field `actuators.*.reason`, `device.time_synced` | Ack idempoten + UI "kenapa alat menyala". Additive — field lama tetap. |
| 5 | **Fault code = string enum firmware** (`SHT30_ERROR` dll.), bukan `F-01..F-06` | Firmware sudah host-tested dengan enum ini. Kode `F-xx` dianggap legacy, tidak dipakai. |
| 6 | **`status/faults` TIDAK diimplementasi di fase ini** | Fault aktif sudah ada di realtime. Log historis = fase berikut. Path tetap sah di rules. |

Konstanta identitas (dipakai semua eksekutor):
- `deviceId` : `snowberry-001`
- `firmware_version` awal : `"0.1.0"`
- Zona waktu lokal device : `Asia/Jakarta` (UTC+7) — dipakai untuk `{YYYY-MM-DD}` telemetry dan photoperiod.

### A1. Autentikasi Device

Metode: **Firebase Auth REST — email/password** milik AKUN DEVICE (bukan akun petani).

| Item | Nilai persis |
| --- | --- |
| Endpoint login | `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}` |
| Body login | `{"email": "<device_email>", "password": "<device_password>", "returnSecureToken": true}` |
| Respons dipakai | `idToken` (string), `refreshToken` (string), `expiresIn` (string detik, biasanya `"3600"`), `localId` (= uid device) |
| Endpoint refresh | `POST https://securetoken.googleapis.com/v1/token?key={API_KEY}` body `grant_type=refresh_token&refresh_token=<refreshToken>` (form-urlencoded) |
| Jadwal refresh | Saat sisa umur token < **300 s** (refresh di T+3300 s). |
| Header Firestore REST | `Authorization: Bearer <idToken>` |

Penyimpanan credential (ESP32): NVS namespace `device_auth`, keys: `email` (string ≤64), `password` (string ≤64), `api_key` (string ≤64), `project_id` (string ≤48). Diisi saat provisioning; TIDAK pernah di-hardcode atau di-commit. Simulator: baca dari env `SNOWBERRY_DEVICE_EMAIL`, `SNOWBERRY_DEVICE_PASSWORD`, `SNOWBERRY_API_KEY`, `SNOWBERRY_PROJECT_ID`, `SNOWBERRY_DEVICE_ID`.

Prasyarat Firestore (seed, dilakukan sekali oleh admin — Tahap 0):
- `users/{device_uid}` = `{"role": "device", "deviceId": "snowberry-001"}`
- `users/{owner_uid}` = `{"role": "farmer", "devices": ["snowberry-001"]}`

Perilaku saat auth GAGAL (berlaku ESP32 & simulator):
1. Gagal (HTTP ≠ 200 / timeout 10 s) → backoff eksponensial: 30 s, 60 s, 120 s, ..., maks 900 s; retry selamanya.
2. Selama belum ter-auth: **kontrol lokal tetap jalan penuh**; tidak ada operasi Firestore; fault internal `FIREBASE_OFFLINE`.
3. HTTP 400 `INVALID_PASSWORD`/`EMAIL_NOT_FOUND` → tetap backoff maks (900 s); jangan hapus credential NVS (bisa jadi salah konfigurasi server, bukan device).

### A2. Publish Status Realtime

- Path: `devices/{deviceId}/status/realtime` — **overwrite penuh dokumen** (bukan merge) setiap tulis.
- Writer: device saja. Reader: web-app (onSnapshot).
- Frekuensi: **interval 60 s** + **on-change** (lihat trigger). On-change di-debounce: minimal jeda **5 s** antar tulis.
- Trigger on-change (salah satu): (a) `state` aktuator mana pun berubah, (b) `fault.active_code` berubah, (c) `command_ack.ack_command_id` berubah.
- Saat offline: TIDAK ada antrean. Tulis berikutnya setelah reconnect memuat state terkini (dokumen selalu snapshot penuh).

Shape kanon (semua field WAJIB ada di setiap tulis; contoh nilai valid):

```json
{
  "sensors": {
    "temperature_c": 23.4,
    "humidity_pct": 67.2,
    "lux": 3450,
    "soil_pct": 55.8,
    "soil_raw_adc": 1875,
    "psu_voltage": 12.1
  },
  "actuators": {
    "growlight": { "mode": "AUTO", "state": false, "manual_until": null, "reason": "lux_ok" },
    "pump":      { "mode": "MANUAL", "state": true, "manual_until": 1751457600000, "reason": "manual_override" },
    "mist":      { "mode": "AUTO", "state": true, "manual_until": null, "reason": "humidity_low" },
    "fan":       { "mode": "AUTO", "state": false, "manual_until": null, "reason": "temp_rh_ok" }
  },
  "device": {
    "online": true,
    "wifi_rssi": -52,
    "ip_address": "192.168.1.47",
    "firmware_version": "0.1.0",
    "uptime_seconds": 86423,
    "free_heap_bytes": 187392,
    "nvs_synced": true,
    "time_synced": true
  },
  "command_ack": {
    "ack_command_id": "cmd_1751457000000_4821",
    "ack_status": "APPLIED",
    "ack_at": 1751457005000,
    "ack_message": "Pompa manual ON diterapkan"
  },
  "fault": {
    "active_code": null,
    "active_message": null,
    "last_fault_code": "SHT30_ERROR",
    "last_fault_at": 1751371200000
  },
  "last_seen": 1751457540000
}
```

Tabel field (hanya yang baru/ambigu; sisanya identik api-contract §4):

| Field | Tipe | Range/Enum | Satuan | Keterangan |
| --- | --- | --- | --- | --- |
| `sensors.soil_raw_adc` | int | 0–4095 | count | Raw ADC untuk debugging kalibrasi. `0` jika belum terbaca. |
| `sensors.*` saat sensor invalid | — | — | — | Kirim **nilai terakhir yang valid**; jika belum pernah valid, kirim `null`. Web menampilkan "Tidak Diketahui" untuk `null`. |
| `actuators.*.mode` | string | `"AUTO"` \| `"MANUAL"` | — | Uppercase persis. |
| `actuators.*.reason` | string | `soil_ok` `soil_low` `humidity_ok` `humidity_low` `humidity_high` `temp_high` `temp_rh_ok` `lux_ok` `lux_low` `manual_override` `sensor_invalid` `config_invalid` `photoperiod_limit` `safety_off` | — | lowercase persis; dari enum `Reason` firmware. |
| `device.time_synced` | boolean | — | — | `true` jika NTP/epoch valid. |
| `command_ack.ack_command_id` | string | — | — | `""` jika belum pernah ada command. |
| `command_ack.ack_status` | string | `""` \| `"APPLIED"` \| `"REJECTED_SAFETY"` \| `"EXPIRED"` \| `"INVALID"` | — | Lihat A4. |
| `command_ack.ack_at` | number\|null | — | ms | `null` jika belum ada ack. |
| `command_ack.ack_message` | string | ≤120 char | — | Bahasa Indonesia, layak tampil ke petani. |
| `fault.active_code` | string\|null | enum Fault firmware (lihat A7) | — | `null` = tidak ada masalah. |
| `last_seen` | number | — | ms | Diisi waktu tulis. Jika `time_synced=false`: isi `0` — web WAJIB menampilkan status koneksi dari umur update onSnapshot, bukan percaya `last_seen=0`. |

### A3. Baca Command (Manual Override)

- Path: `devices/{deviceId}/config/commands` — dokumen tunggal, overwrite oleh web setiap command baru.
- Writer: web-app. Reader: device (**polling GET setiap 10 s**; tidak pakai listener di device).
- Deteksi command baru: bandingkan `command_id` dokumen dengan `last_processed_command_id` yang disimpan device di RAM (dan mirror ke NVS key `last_cmd_id`, namespace `device_auth`). Jika sama → abaikan tanpa ack ulang. Jika beda → proses lalu update `last_processed_command_id` (idempoten).

Shape kanon (ditulis web; sudah sesuai `web-app/src/services/dataSource.ts`):

```json
{
  "command_id": "cmd_1751457000000_4821",
  "actuator": "pump",
  "mode": "MANUAL",
  "state": true,
  "command_type": "REWATER",
  "manual_duration_ms": 1800000,
  "manual_until": 1751458800000,
  "issued_at": 1751457000000,
  "issued_by": "uid_owner_abc"
}
```

| Field | Tipe | Range/Enum | Keterangan |
| --- | --- | --- | --- |
| `command_id` | string | non-empty, ≤64 | Unik per command (`cmd_<epoch>_<rand>`). |
| `actuator` | string | `"growlight"` \| `"pump"` \| `"mist"` \| `"fan"` | lowercase persis. |
| `mode` | string | `"AUTO"` \| `"MANUAL"` | `"AUTO"` = batalkan manual, kembali otomatis (field `state` diabaikan). |
| `state` | boolean | — | Target ON/OFF saat `mode="MANUAL"`. |
| `command_type` | string\|null | `"REWATER"` | Opsional. Hanya valid untuk `actuator="pump"`, `mode="MANUAL"`, dan `state=true`. Device menerima hanya saat `PUMP_NO_EFFECT` aktif, lalu menjalankan satu pulsa aman firmware; selain itu `REJECTED_SAFETY`. |
| `manual_duration_ms` | number | 1 – 1.800.000 | WAJIB ≤ 30 menit. Di luar range → device clamp ke 1.800.000; `0`/negatif → `INVALID`. |
| `manual_until` | number | — | epoch ms; dipakai HANYA jika `time_synced=true`. |
| `issued_at` | number | — | epoch ms dari web. |
| `issued_by` | string | — | UID user web. |

Saat command baru terdeteksi, device WAJIB mencatat `received_at_ms = millis()` (ESP32) / `Date.now()` (simulator) — dasar expiry fallback (lihat B3).

### A4. Tulis Acknowledgement

- Lokasi: blok `command_ack` di dalam `status/realtime` (bukan dokumen terpisah — hemat write & rules tetap bersih: device tidak menulis ke `config/*`).
- Kapan: segera setelah command diproses → trigger on-change publish status (dalam ≤5 s + debounce).

| `ack_status` | Kapan dipakai | `ack_message` contoh |
| --- | --- | --- |
| `APPLIED` | Command valid, lolos safety, state diterapkan (termasuk `mode:"AUTO"` yang membatalkan manual) | `"Pompa manual ON diterapkan"` atau `"Penyiraman ulang dimulai"` |
| `REJECTED_SAFETY` | Safety layer menang: mis. pump ON saat `soil_valid=false`, kalibrasi hilang, `PSU_VOLTAGE_LOW`, `CONFIG_INVALID` | `"Perintah ditolak: sensor media tidak valid"` |
| `EXPIRED` | Saat pertama dibaca, command sudah lewat masa berlaku (epoch: `now >= manual_until`; fallback: `issued_at` menunjukkan usia > `manual_duration_ms` — hanya bisa dinilai jika `time_synced=true`; jika tidak synced, command yang baru terdeteksi TIDAK pernah langsung EXPIRED) | `"Perintah sudah kedaluwarsa"` |
| `INVALID` | Gagal parse: field wajib hilang, `actuator` di luar enum, `mode` di luar enum, `manual_duration_ms ≤ 0`, `command_id` kosong | `"Perintah tidak valid"` |

Catatan: expiry NORMAL setelah command berjalan (habis 30 menit) TIDAK menghasilkan ack baru; device cukup kembali AUTO dan `actuators.*.mode/manual_until/reason` di status berikutnya mencerminkannya.

### A5. Fetch & Apply Thresholds

- Path: `devices/{deviceId}/config/thresholds`. Writer: web. Reader: device (**polling GET setiap 60 s** + sekali saat boot/reconnect).
- Deteksi perubahan: bandingkan `updated_at`; jika sama dengan yang terakhir diterapkan → skip.

Shape kanon = api-contract §3 **plus field tambahan** (additive, semua WAJIB ditulis web dengan default bila user tidak mengubah):

| Field tambahan | Tipe | Default | Min | Max | Satuan |
| --- | --- | --- | --- | --- | --- |
| `max_pump_cycles_per_hour` | int | 6 | 1 | 20 | siklus |
| `max_total_pump_on_ms_per_hour` | int | 30000 | 5000 | 300000 | ms |
| `light_window_start` | int | 6 | 0 | 23 | jam lokal |
| `light_window_end` | int | 18 | 1 | 24 | jam lokal |
| `max_light_hours_per_day` | float | 14.0 | 1.0 | 20.0 | jam |

Validasi WAJIB device sebelum simpan NVS (urutan pasti; gagal satu = tolak semua):
1. `temp_low < temp_high`; keduanya di range 10.0–35.0
2. `rh_low < rh_high`; keduanya 30.0–95.0
3. `soil_low < soil_high`; keduanya 10.0–90.0
4. `lux_low < lux_high`; keduanya 500–50000
5. `pump_pulse_ms` 1000–30000; `soak_period_ms` 10000–300000; `pump_pulse_ms <= soak_period_ms`
6. `max_pump_cycles_per_hour` 1–20; `max_total_pump_on_ms_per_hour` 5000–300000
7. `light_window_start < light_window_end`; `light_window_end <= 24`; `max_light_hours_per_day` 1.0–20.0
8. `planting_date`: diabaikan device (web-only); TIDAK divalidasi device.

Jika INVALID: (a) JANGAN sentuh NVS, (b) pakai threshold NVS lama, (c) set fault `CONFIG_INVALID` + `active_message` menyebut field pertama yang gagal, (d) `device.nvs_synced=false` di status. Jika VALID: simpan NVS → `nvs_synced=true` → fault `CONFIG_INVALID` clear.

### A6. Telemetry

- Path: `devices/{deviceId}/telemetry/{YYYY-MM-DD}` — tanggal **lokal Asia/Jakarta**. Rollover saat pergantian hari lokal.
- Mekanisme: append 1 entri ke array `d` per menit via arrayUnion (REST: `Firestore.commit` transform `appendMissingElements`). Dokumen envelope: `device_id` (string), `date` (string `YYYY-MM-DD`), `d` (array).
- **[PENTING — key kanon = api-contract §5]**: `t`, `h`, `l`, `s`, `gl`, `p`, `m`, `f`, `ts`. (Builder firmware `status_json.cpp` saat ini memakai key berbeda — WAJIB disesuaikan di Tahap 7; web sudah kanon.)

| Key | Arti | Tipe | Satuan | Contoh |
| --- | --- | --- | --- | --- |
| `t` | temperature_c | float | °C | 22.8 |
| `h` | humidity_pct | float | %RH | 65.4 |
| `l` | lux | int | lux | 3200 |
| `s` | soil_pct | float | % | 52.1 |
| `gl` | growlight ON | boolean | — | false |
| `p` | pump ON | boolean | — | true |
| `m` | mist ON | boolean | — | true |
| `f` | fan ON | boolean | — | false |
| `ts` | timestamp | number | ms | 1751414460000 |

- Interval: 60 s. Syarat tulis: `time_synced=true` (tanpa epoch valid, `ts` tidak bermakna → SKIP, jangan tulis `ts` palsu).
- Buffer offline: ring buffer RAM maks **10 entri** (10 menit). Saat reconnect: flush berurutan (1 commit berisi ≤10 appendMissingElements = 1 write). Lebih tua dari itu HILANG — by design; kontrol lokal > kelengkapan grafik.

### A7. Enum Fault (kanon, dipakai `fault.active_code`)

`WIFI_OFFLINE` `FIREBASE_OFFLINE` `TIME_NOT_SYNCED` `SHT30_ERROR` `BH1750_ERROR` `I2C_BUS_STUCK` `SOIL_SENSOR_ERROR` `SOIL_CALIBRATION_MISSING` `PSU_VOLTAGE_LOW` `CONFIG_INVALID` `NVS_ERROR` `COMMAND_EXPIRED` `COMMAND_REJECTED_SAFETY` `PUMP_NO_EFFECT` `PUMP_MAX_CYCLE_REACHED`
Prioritas tampil (satu `active_code` saja, angka kecil menang): 1 `PSU_VOLTAGE_LOW` · 2 `I2C_BUS_STUCK` · 3 `SHT30_ERROR` · 4 `SOIL_SENSOR_ERROR` · 5 `BH1750_ERROR` · 6 `SOIL_CALIBRATION_MISSING` · 7 `PUMP_NO_EFFECT` · 8 `PUMP_MAX_CYCLE_REACHED` · 9 `CONFIG_INVALID` · 10 `NVS_ERROR` · 11 `TIME_NOT_SYNCED` · 12 `FIREBASE_OFFLINE` · 13 `WIFI_OFFLINE`. (`COMMAND_*` hanya muncul via `ack_status`, tidak jadi `active_code`.)

---

## B. STATE MACHINE & EDGE CASES

### B1. Urutan Boot & Degradasi

```
BOOT → SAFE_STATE (semua aktuator OFF, latch sebelum pinMode)
     → NVS load (threshold + kalibrasi; gagal → default + fault NVS_ERROR)
     → CONTROL_ACTIVE (loop kontrol lokal jalan — TITIK INI TIDAK MENUNGGU APAPUN DI BAWAH)
     → [async] WiFi connect (non-blocking, retry per device-pairing.md)
     → [async] NTP sync (timeout 10 s; gagal → time_synced=false, lanjut)
     → [async] Firebase auth (A1) → fetch thresholds (A5) → mulai loop publish/poll
```
Setiap tahap async yang gagal TIDAK menghalangi tahap sebelumnya. Fault berjenjang: tanpa WiFi = `WIFI_OFFLINE`; WiFi ok tanpa Firebase = `FIREBASE_OFFLINE`; keduanya ok tanpa NTP = `TIME_NOT_SYNCED`.

### B2. WiFi Putus → Reconnect → Resync

Putus: loop kontrol lanjut dengan threshold NVS; polling/publish di-skip (bukan diantre, kecuali telemetry ring buffer A6); reconnect attempt tiap 15 s, non-blocking.
Reconnect (urutan WAJIB): (1) NTP re-sync → (2) auth check/refresh token → (3) **fetch thresholds sekali** (bisa jadi berubah selama offline) → (4) **baca commands sekali** — proses HANYA jika `command_id ≠ last_processed_command_id` DAN belum expired (cek epoch karena time_synced baru saja true) → (5) publish status segera → (6) flush telemetry buffer → (7) kembali ke jadwal normal.

### B3. Command Saat NTP Belum Sync (fallback millis)

Saat command baru terdeteksi: simpan `received_at_ms` = clock monotonic lokal (`millis()`/`Date.now()`).
- `time_synced=true` → expired jika `epoch_now >= manual_until`.
- `time_synced=false` → expired jika `monotonic_now - received_at_ms >= min(manual_duration_ms, 1800000)`.
- `manual_duration_ms` di luar 1..1800000 → clamp ke 1800000 (nilai ≤0 → `INVALID`, jangan clamp).
Kedua jalur sudah host-tested di firmware (`control.cpp` applyManual); simulator WAJIB meniru persis.

### B4. Command Ditolak Safety

Precedence (tetap): fault/hard-safety > sensor invalid > manual > auto. Command yang kalah → `ack_status="REJECTED_SAFETY"`, `last_processed_command_id` TETAP diupdate (tidak dicoba ulang otomatis), aktuator mengikuti safety (OFF).

### B5. command_id Duplikat

`command_id == last_processed_command_id` → no-op total: tidak ada ack baru, tidak ada log fault. Web yang butuh re-apply WAJIB menerbitkan `command_id` baru.

### B6. Retry Policy Firestore Write

| Operasi | Retry | Backoff | Saat menyerah |
| --- | --- | --- | --- |
| Status publish | 2× | 2 s, lalu 8 s | Drop — snapshot berikut (≤60 s) menggantikan |
| Telemetry commit | 2× | 2 s, 8 s | Entri kembali ke ring buffer (jika masih muat; kalau penuh, buang tertua) |
| Ack (via status) | mengikuti status publish | — | — |
| GET thresholds/commands | 0 (skip) | — | Coba lagi di siklus polling berikutnya |
| HTTP 401 di operasi apa pun | 1× refresh token lalu ulangi sekali | — | Gagal lagi → full re-login (A1) |
Timeout HTTP semua operasi: 10 s. Retry TIDAK boleh memblokir control loop (async/state machine).

### B7. Threshold Invalid dari Cloud

Sudah dispesifikasi di A5. Tambahan: device TIDAK menulis balik/memperbaiki dokumen thresholds (config = wilayah tulis user); koreksi dilakukan user dari web yang melihat `nvs_synced=false` + fault `CONFIG_INVALID`.

---

## C. SIMULATOR / TEST HARNESS (Node.js)

### C1. Bentuk

- Folder: `simulator/` (root repo). Runtime: Node.js ≥18. Dependency: HANYA `firebase` (JS SDK, sama dengan web-app) + stdlib. TANPA framework test.
- Konfigurasi: env / file `.env` lokal (tidak di-commit): `SNOWBERRY_API_KEY`, `SNOWBERRY_PROJECT_ID`, `SNOWBERRY_DEVICE_ID`, `SNOWBERRY_DEVICE_EMAIL`, `SNOWBERRY_DEVICE_PASSWORD`.
- Struktur file (target — nama mengikat):
  - `simulator/index.js` — entry, loop utama, arg parsing (`--scenario=<nama>`)
  - `simulator/contract.js` — SATU-SATUNYA tempat shape dokumen dibangun (mirror A2–A6; fungsi: `buildStatus()`, `buildTelemetryEntry()`, `validateThresholds()`, `evaluateCommand()`) — file ini adalah padanan 1:1 seam `firmware/include/firebase_sync.h` + `control.cpp` applyManual, sehingga firmware asli tinggal mengisi perilaku yang sama dalam C++
  - `simulator/synthetic.js` — generator data sensor sintetis
  - `simulator/README.md` — cara pakai + tabel skenario

### C2. Data Sintetis (masuk akal untuk Ciwidey)

Random-walk dengan batas: suhu 16–29 °C (sinusoid harian, puncak ±14:00, noise ±0.3); RH 60–95 % (inversi suhu + noise ±2); lux 0 malam, 1000–20000 siang mengikuti jam lokal; soil mulai 65 %, turun ~0.5 %/10 menit, naik +8 % saat `pump=true` (mensimulasikan efek siram — memberi jalur uji `PUMP_NO_EFFECT` bila dimatikan via skenario); psu 11.8–12.3. Aktuator dihitung dari logika bang-bang yang SAMA aturannya dengan firmware (ambang dari thresholds terkini).

### C3. Perilaku Wajib (mirror kontrak)

Login A1 (SDK menangani token) → publish status 60 s + on-change debounce 5 s (A2) → poll commands 10 s + idempoten `command_id` + fallback millis (A3/B3/B5) → tulis ack via status (A4) → poll thresholds 60 s + validasi A5 (invalid → `CONFIG_INVALID`, `nvs_synced=false`, JANGAN terapkan) → telemetry per menit dengan key kanon + ring buffer 10 (A6).

### C4. Skenario (arg `--scenario=`)

| Skenario | Yang disimulasikan | Yang divalidasi penguji dari web-app |
| --- | --- | --- |
| `normal` (default) | Loop sehat penuh | Dashboard hidup; grafik bertambah per menit; toggle manual dari web → ack `APPLIED` ≤15 s; kembali AUTO setelah durasi |
| `offline` | Setelah 3 menit sehat: stop semua tulis 5 menit, lalu resume dengan urutan B2 | Web menandai perangkat stale; saat resume: threshold yang diubah selama "offline" ikut terpakai; telemetry bolong maks 10 menit terisi kembali (buffer) |
| `no-ntp` | `time_synced=false`: `last_seen=0`, telemetry SKIP, expiry via fallback | Command manual tetap expired sesuai durasi walau tanpa epoch |
| `fault-soil` | `soil_valid=false`: sensors.soil_pct=null, pump reason=`sensor_invalid`, fault `SOIL_SENSOR_ERROR`; command pump ON → `REJECTED_SAFETY` | Banner "Masalah" muncul; toggle pompa ditolak dengan pesan jelas |
| `fault-psu` | psu_voltage 9.5; fault `PSU_VOLTAGE_LOW`; pump+fan OFF | Prioritas fault tampil benar |
| `config-invalid` | Balas thresholds masuk dengan `nvs_synced=false` + `CONFIG_INVALID` bila user menyimpan kombinasi yang lolos UI tapi gagal validasi device | Uji dua lapis validasi tidak saling bertentangan |

Definition-of-done simulator: seluruh baris tabel di atas bisa didemokan dengan web-app produksi (adapter Firebase) TANPA hardware.

---

## D. RENCANA EKSEKUSI BERTAHAP

Setiap tahap independen, punya DoD terverifikasi, tidak merusak yang sudah hijau. Urutan memastikan simulator jadi SEBELUM firmware sync.

| Tahap | Nama | File disentuh | Isi pekerjaan | DoD (verifikasi) | Depends |
| --- | --- | --- | --- | --- | --- |
| 0 | Setup project Firebase | (console; `firebase/README.md` update kecil) | Buat project, aktifkan Auth email/password + Firestore, deploy `firebase/firestore.rules`, buat akun owner + akun device, seed `users/{uid}` sesuai A1, seed `config/thresholds` default | Rules deployed; login kedua akun berhasil; dokumen seed terbaca | — |
| 1 | Sinkronisasi tipe web | `web-app/src/types.ts`, `web-app/src/data/mockSnowberry.ts` | Tambah field additive: `sensors.soil_raw_adc?`, `actuators.*.reason?`, `device.time_synced?`, blok `command_ack?` (semua OPTIONAL agar mock lama tetap valid); sensors nullable sudah ada | `npm run build` hijau; tidak ada perubahan perilaku UI | — |
| 2 | Simulator core | `simulator/package.json`, `simulator/index.js`, `simulator/contract.js`, `simulator/synthetic.js` | Login device + publish status 60 s + data sintetis; `contract.js` mengimplementasi A2 persis | Jalankan `node simulator/index.js`; dokumen `status/realtime` muncul di console Firestore dengan shape A2 lengkap; web-app (env Firebase) menampilkan data live | 0, 1 |
| 3 | Simulator command+ack | `simulator/contract.js`, `simulator/index.js` | Poll 10 s, idempoten, `evaluateCommand()` (APPLIED/REJECTED_SAFETY/EXPIRED/INVALID), fallback millis, ack via status | Dari web: toggle manual → ack `APPLIED` ≤15 s; kirim command_id sama 2× → 1 eksekusi; skenario `no-ntp` & `fault-soil` lulus | 2 |
| 4 | Simulator thresholds+telemetry+skenario | `simulator/contract.js`, `simulator/synthetic.js`, `simulator/index.js`, `simulator/README.md` | `validateThresholds()` A5, telemetry key kanon + ring buffer, semua `--scenario` C4 | Seluruh tabel C4 didemokan; grafik Riwayat web terisi dari telemetry simulator | 3 |
| 5 | Web ack UX | `web-app/src/App.tsx`, `web-app/src/services/*` | Tampilkan status kirim command: "Mengirim…" → sukses saat `command_ack.ack_command_id` cocok, timeout 20 s → "Gagal/Timeout"; tampilkan `reason` di kartu alat (fallback tanpa reason = perilaku lama) | Build hijau; uji manual vs simulator skenario `normal` + `fault-soil` | 1, 3 |
| 6 | Firmware fbsync — auth+status | `firmware/src/firebase_sync.cpp` (baru), `firmware/include/firebase_sync.h`, `firmware/platformio.ini` (lib HTTPS) | Implementasi A1 + A2 via Firestore REST; non-blocking state machine; `status_json.cpp` dipakai sebagai builder — disesuaikan ke shape A2 (tambah `command_ack`, `manual_until`, `mode`, `ip_address`, `uptime_seconds`, `free_heap_bytes`, `nvs_synced`) | Host test builder JSON baru hijau; kompilasi `pio run` sukses; di hardware: dokumen realtime muncul (checklist E) | 0; paralel dgn 2–5 |
| 7 | Firmware fbsync — command+thresholds+telemetry | `firmware/src/firebase_sync.cpp`, `firmware/src/status_json.cpp`, `firmware/src/main.cpp`, test host | A3/A4/A5/A6; **perbaiki key telemetry ke kanon** (`t,h,l,s,gl,p,m,f,ts`); wire `g_manual.received_at_ms` dari poller; retry policy B6 | Host test: parser command (fixture JSON A3) + validasi threshold + builder telemetry hijau; skenario B2 disimulasikan di host dgn fake transport | 6 |
| 8 | Uji silang kontrak | `simulator/README.md` (tabel hasil) | Jalankan web + simulator + (bila ada) hardware bergantian pada project Firebase yang sama; bandingkan dokumen yang ditulis keduanya field-per-field | Diff shape device-asli vs simulator = KOSONG | 4, 7 |

Catatan multi-model: setiap tahap membawa dokumen INI sebagai lampiran; eksekutor DILARANG menyimpang dari nama field/enum/urutan; bila menemukan ambiguitas, berhenti dan tanya — jangan menetapkan sendiri.

---

## E. RISIKO & CHECKLIST UJI HARDWARE (pasca-pengabdian)

Tidak bisa divalidasi simulator — wajib diuji di device nyata:

1. **TLS + heap ESP32**: koneksi HTTPS Firestore (~40 KB heap per handshake). Ukur `free_heap_bytes` sebelum/sesudah; target sisa >80 KB stabil 24 jam. Risiko: fragmentasi heap → crash berkala.
2. **Blocking nyata HTTP**: pastikan control loop tetap <1,2 s per iterasi SAAT request berjalan (ukur dengan `millis()` delta log). Jika library blocking, pindahkan sync ke task FreeRTOS terpisah core 0.
3. **NTP setelah mati listrik**: cabut listrik + router mati → boot → verifikasi `time_synced=false`, growlight mode konservatif, manual expiry fallback jalan (uji 30+ menit).
4. **Brownout saat relay switching + WiFi TX**: nyalakan pompa saat publish status berlangsung; tidak boleh reset (cek register brownout). Terkait kapasitor bulk 470 µF.
5. **I2C hang di lapangan**: kabel sensor panjang + EMI relay → paksa dengan cabut-pasang SDA saat operasi; recovery 9-clock harus memulihkan tanpa reboot.
6. **RSSI Ciwidey**: ukur `wifi_rssi` riil di lokasi greenhouse; < −80 dBm → butuh reposisi router/antena. Uji perilaku pada packet loss tinggi (retry policy B6 di jaringan buruk nyata).
7. **Day rollover telemetry**: biarkan menyala melewati 00:00 WIB; dokumen baru `{YYYY-MM-DD}` terbentuk otomatis; tidak ada entri masuk dokumen hari yang salah.
8. **Token refresh jangka panjang**: 24–48 jam nonstop; tidak ada gap publish > 2 menit di sekitar T+1 jam kelipatan (bukti refresh mulus).
9. **Kuota riil**: setelah 24 jam, cek Firebase console usage ≈ estimasi (±20%): ~2.900 write, ~11.000 read/hari (dengan polling 10 s/60 s).
10. **Boot safe-state di PCB nyata**: reboot 20×, relay tidak boleh klik (sudah fix di firmware; validasi fisik tetap wajib — checklist `docs/05-hardware/05`).
