#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
SKILLS_DIR="$CODEX_HOME/skills"
CACHE_DIR="$PROJECT_ROOT/.codex-cache/internet-skills"

echo "== Internet Codex Skills Installer =="
echo "Project root : $PROJECT_ROOT"
echo "Codex home   : $CODEX_HOME"
echo "Skills dir   : $SKILLS_DIR"
echo ""

mkdir -p "$SKILLS_DIR"
mkdir -p "$CACHE_DIR"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1"
    return 1
  fi
}

need_cmd git
need_cmd curl

clone_or_pull() {
  local repo="$1"
  local dir="$2"

  if [ ! -d "$dir/.git" ]; then
    git clone "$repo" "$dir"
  else
    git -C "$dir" pull --ff-only
  fi
}

copy_skill_if_exists() {
  local src="$1"
  local name="$2"

  if [ -f "$src/SKILL.md" ]; then
    rm -rf "$SKILLS_DIR/$name"
    cp -R "$src" "$SKILLS_DIR/$name"
    echo "Installed skill: $name"
  else
    echo "Skip, SKILL.md not found: $src"
  fi
}

echo "== 1. Install RTK AI =="
if ! command -v rtk >/dev/null 2>&1; then
  curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh || true
fi

if [ -x "$HOME/.local/bin/rtk" ]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

if command -v rtk >/dev/null 2>&1; then
  rtk init -g --codex || true
  rtk init --agent antigravity || true
  echo "RTK OK: $(command -v rtk)"
else
  echo "RTK belum kebaca. Kalau pakai fish, nanti jalankan: fish_add_path ~/.local/bin"
fi

echo ""
echo "== 2. Install Caveman =="
curl -fsSL https://raw.githubusercontent.com/JuliusBrussee/caveman/main/install.sh | bash || true

echo ""
echo "== 3. Clone Ponytail =="
clone_or_pull "https://github.com/DietrichGebert/ponytail.git" "$CACHE_DIR/ponytail"

if [ -d "$CACHE_DIR/ponytail/skills/ponytail" ]; then
  copy_skill_if_exists "$CACHE_DIR/ponytail/skills/ponytail" "ponytail"
fi

if command -v codex >/dev/null 2>&1; then
  echo "Trying Codex Ponytail plugin install..."
  codex plugin marketplace add DietrichGebert/ponytail || true
else
  echo "Codex command belum ditemukan. Ponytail plugin bisa diinstall manual nanti."
fi

echo ""
echo "== 4. Clone Composio awesome-codex-skills =="
clone_or_pull "https://github.com/ComposioHQ/awesome-codex-skills.git" "$CACHE_DIR/awesome-codex-skills"

echo ""
echo "== 5. Install selected practical Codex skills from Composio =="

# Core practical skills. Tidak install semua biar Codex tidak kebanyakan trigger.
SELECTED_SKILLS=(
  "create-plan"
  "codebase-migrate"
  "gh-fix-ci"
  "pr-review-ci-fix"
  "webapp-testing"
  "theme-factory"
  "changelog-generator"
  "file-organizer"
  "skill-installer"
)

for skill in "${SELECTED_SKILLS[@]}"; do
  copy_skill_if_exists "$CACHE_DIR/awesome-codex-skills/$skill" "$skill"
done

echo ""
echo "== 6. Clone awesome skill catalogs as reference only =="

clone_or_pull "https://github.com/VoltAgent/awesome-agent-skills.git" "$CACHE_DIR/awesome-agent-skills-voltagent" || true
clone_or_pull "https://github.com/RoggeOhta/awesome-codex-cli.git" "$CACHE_DIR/awesome-codex-cli" || true
clone_or_pull "https://github.com/heilcheng/awesome-agent-skills.git" "$CACHE_DIR/awesome-agent-skills-heilcheng" || true

echo ""
echo "== 7. Buat helper AGENTS.md minimal, bukan skill baru =="

if [ ! -f "$PROJECT_ROOT/AGENTS.md" ]; then
  cat > "$PROJECT_ROOT/AGENTS.md" <<'EOF'
# Snowberry Agent Instructions

Baca dokumen project sebelum coding.

Prioritas dokumen:
1. `docs/00-antigravity/ANTIGRAVITY_MASTER_PROMPT_SNOWBERRY_ID.md`
2. `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
3. `docs/01-product/overview.md`
4. `docs/01-product/prd.md`
5. `docs/01-product/ux-flow.md`
6. `docs/02-frontend/DESIGN-starbucks.md`
7. `docs/03-technical/api-contract.md`
8. `docs/03-technical/wiring-schematic.md`

Rules:
- Untuk frontend, kerja hanya di `web-app/`.
- Ikuti `DESIGN-starbucks.md` untuk warna, font, spacing, card, dan layout.
- UI harus Bahasa Indonesia dan mudah dipahami petani.
- Jangan integrasi Firebase sebelum diminta.
- Gunakan mock data dulu.
- Jangan bikin fitur di luar MVP.
- Jangan ubah dokumen di `docs/` kecuali diminta.

MVP awal:
- Dashboard
- Sensor cards
- Actuator cards
- Batas Otomatis
- Riwayat sederhana
- Fase Tanam/HST
EOF
  echo "Created AGENTS.md minimal"
else
  echo "AGENTS.md sudah ada, tidak ditimpa."
fi

echo ""
echo "== 8. Buat prompt awal Codex =="

cat > "$PROJECT_ROOT/PROMPT_AWAL_CODEX.md" <<'EOF'
Ikuti AGENTS.md.

Gunakan skill repo internet yang relevan kalau tersedia:
- create-plan untuk rencana kerja kecil
- webapp-testing untuk validasi frontend
- theme-factory jika perlu menerapkan design system
- ponytail untuk menghindari over-engineering
- caveman untuk jawaban ringkas

Tugas pertama:
Kerjakan hanya di folder `web-app/`.

Buat frontend mock Snowberry Smart Greenhouse untuk petani stroberi putih Ciwidey.

Wajib baca dan ikuti:
1. `docs/02-frontend/DESIGN-starbucks.md` untuk color palette, font, spacing, card style, layout, dan visual direction.
2. `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md` untuk bahasa UI petani.
3. `docs/01-product/ux-flow.md` untuk struktur halaman.
4. `docs/03-technical/api-contract.md` hanya untuk bentuk mock data, belum integrasi Firebase.

Untuk tahap pertama, jangan integrasi Firebase dulu.
Gunakan mock data lokal.

Yang harus dibuat dulu:
1. Setup web app React + Vite + TypeScript jika belum ada.
2. Dashboard mobile-first.
3. Kartu sensor:
   - Suhu Udara
   - Kelembapan Udara
   - Cahaya
   - Kelembapan Tanah
4. Kartu alat:
   - Lampu Tanam
   - Pompa Air
   - Kabut
   - Kipas
5. Status:
   - Aman
   - Perlu Perhatian
   - Bahaya
   - Offline
6. Navigasi sederhana:
   - Dashboard
   - Batas Otomatis
   - Riwayat
   - Fase Tanam
7. Halaman Batas Otomatis pakai form mock.
8. Halaman Riwayat pakai grafik/placeholder data dummy.
9. Halaman Fase Tanam menampilkan HST dan fase tanaman.
10. Loading, empty state, dan error state dalam Bahasa Indonesia.

Batasan:
- Jangan buat backend.
- Jangan buat Firebase integration.
- Jangan buat admin panel.
- Jangan buat multi-farm SaaS.
- Jangan buat AI diagnosis.
- Jangan ubah isi `docs/`.
- Jangan over-engineering.
- Setelah selesai, jalankan `npm run build` jika tersedia dan laporkan hasilnya.

Output yang saya mau:
1. Sebutkan file yang dibuat/diubah.
2. Jelaskan singkat struktur komponen.
3. Jelaskan cara menjalankan web app.
4. Sebutkan apakah build berhasil.
EOF

echo ""
echo "== Done =="
echo "Installed skills in: $SKILLS_DIR"
echo ""
find "$SKILLS_DIR" -maxdepth 2 -name SKILL.md | sort
echo ""
echo "Prompt awal:"
echo "$PROJECT_ROOT/PROMPT_AWAL_CODEX.md"
echo ""
echo "Kalau pakai fish dan rtk belum kebaca, setelah exit bash jalankan:"
echo "fish_add_path ~/.local/bin"
echo ""
echo "Untuk Ponytail plugin:"
echo "Buka codex, lalu /plugins dan /hooks untuk review/trust jika diminta."
