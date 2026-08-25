# Snowberry Status-to-Telemetry Capture

Menyalin snapshot sensor dari `devices/snowberry-001/status/realtime` ke dokumen
`telemetry/{tanggal-WIB}` **selama firmware ESP32 belum v1.1.0** (build v1.0.0
memang tidak mengirim telemetry — fungsi `appendTelemetry` masih stub).

Sampel ditulis dengan format & mekanisme yang identik dengan firmware
(`documents:commit` + `appendMissingElements` pada field `d`), plus penanda
`src:"cap"` agar asalnya bisa dibedakan di laporan.

## Berkas

| Berkas | Fungsi |
|---|---|
| `capture.mjs` | Script utama (Node >= 18, tanpa dependency) |
| `config.example.json` | Template konfigurasi |
| `snowberry-capture.service` | Unit systemd (auto-restart) |

## Setup di VPS

```bash
# 1. Salin folder ini ke VPS, mis. /opt/snowberry-capture
scp -r firebase/status-capture/ user@vps:/opt/snowberry-capture/

# 2. Pastikan Node.js >= 18
node --version

# 3. Siapkan konfigurasi (JANGAN di-commit)
cd /opt/snowberry-capture
cp config.example.json config.local.json
nano config.local.json          # isi apiKey + password akun capture
chmod 600 config.local.json

# 4. Uji manual dulu (harus muncul "sampel tersimpan" tiap ±60 detik)
node capture.mjs
# Ctrl+C untuk berhenti

# 5. Pasang sebagai service systemd
sudo cp snowberry-capture.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now snowberry-capture

# 6. Pantau
journalctl -u snowberry-capture -f
```

## Verifikasi data masuk

Buka aplikasi web → Riwayat → "Hari Ini". Grafik mulai terisi setelah ±2 menit.
Atau cek langsung: `web-app` → halaman Riwayat → tombol Unduh CSV.

## Setelah ESP32 diflash ke v1.1.0

Matikan capture agar penulis telemetry kembali ke firmware saja:

```bash
sudo systemctl disable --now snowberry-capture
```

(Data yang sudah terekam oleh capture tetap valid dan tidak perlu dihapus;
dedup berbasis `ts` membuat tidak akan ada duplikat.)
