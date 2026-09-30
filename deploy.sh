#!/usr/bin/env bash
# ==============================================================================
# RAKSA GAME - deploy satu perintah (Linux server atau Git Bash di Windows)
#
#   ./deploy.sh                 tarik kode terbaru (git pull), install bila perlu, build,
#                               cadangkan data, restart server, lalu cek kesehatan
#   ./deploy.sh status          versi yang terpasang + apakah server hidup
#   ./deploy.sh stop            hentikan server
#   ./deploy.sh start           jalankan server dari build yang ada (tanpa git pull)
#   ./deploy.sh log             ikuti log server (mode latar)
#
# Pilihan untuk deploy:
#   --tes            jalankan `npm test` sebelum build; gagal = deploy dibatalkan
#   --paksa          tetap deploy walau masih ada room hidup (SEMUA pemain terputus!)
#   --build-ulang    build & restart walau tidak ada commit baru
#   --stash          simpan perubahan lokal ke `git stash` alih-alih menolak deploy
#   --cabang NAMA    cabang yang ditarik (bawaan: cabang yang sedang aktif)
#   --tanpa-rollback jangan kembali ke versi lama bila build/start gagal
#
# Pengelola proses dipilih otomatis (paksa dengan RAKSA_PENGELOLA=systemd|pm2|latar):
#   systemd  bila ada unit `raksa-game.service`      -> systemctl stop/start
#   pm2      bila perintah `pm2` tersedia            -> proses bernama `raksa-game`
#   latar    selain itu: `nohup node ...` + log di .deploy/server.log
#
# Yang dijaga skrip ini:
#   - Server menyimpan room di MEMORI. Restart = semua room hilang, jadi deploy ditolak
#     bila masih ada room hidup (kecuali --paksa). Jangan deploy saat acara berjalan.
#   - Database + gambar soal dicadangkan ke <folder data>/cadangan/ (5 terakhir disimpan).
#   - Hanya proses server game ini yang dimatikan. Bila port dipakai program lain, skrip berhenti.
#   - Build/start gagal -> kode dikembalikan ke commit sebelumnya dan server lama dijalankan lagi.
# ==============================================================================
set -Eeuo pipefail

AKAR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$AKAR"

NAMA="raksa-game"
DIR_DEPLOY="$AKAR/.deploy"
LOG="$DIR_DEPLOY/server.log"
ENTRI="dist/server/src/index.js" # relatif terhadap server/
JUMLAH_CADANGAN=5

case "$(uname -s)" in MINGW* | MSYS* | CYGWIN*) WINDOWS=1 ;; *) WINDOWS=0 ;; esac

if [ -t 1 ]; then
  C_HIJAU=$'\033[32m'; C_KUNING=$'\033[33m'; C_MERAH=$'\033[31m'; C_TEBAL=$'\033[1m'; C_NOL=$'\033[0m'
else
  C_HIJAU=""; C_KUNING=""; C_MERAH=""; C_TEBAL=""; C_NOL=""
fi
langkah() { printf '\n%s==> %s%s\n' "$C_TEBAL" "$*" "$C_NOL"; }
info() { printf '    %s\n' "$*"; }
oke() { printf '    %s[ok]%s %s\n' "$C_HIJAU" "$C_NOL" "$*"; }
awas() { printf '    %s[!]%s  %s\n' "$C_KUNING" "$C_NOL" "$*" >&2; }
gagal() { printf '\n%s[GAGAL]%s %s\n' "$C_MERAH" "$C_NOL" "$*" >&2; exit 1; }

# ------------------------------------------------------------------ pembantu

# nilai_env KUNCI BAWAAN -> nilai dari .env (tanpa kutip & spasi tepi), atau BAWAAN
nilai_env() {
  local v=""
  if [ -f "$AKAR/.env" ]; then
    v="$(grep -E "^[[:space:]]*$1=" "$AKAR/.env" 2>/dev/null | tail -n 1 | cut -d= -f2- | tr -d '\r' |
      sed -e 's/[[:space:]]*#.*$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/")" || v=""
  fi
  printf '%s' "${v:-$2}"
}

PORT="${PORT:-$(nilai_env PORT 4000)}"
ALAMAT="http://127.0.0.1:$PORT"

# Jumlah room hidup; -1 = server tidak menjawab.
jumlah_room() {
  node -e 'fetch(process.argv[1],{signal:AbortSignal.timeout(3000)}).then(r=>r.json()).then(d=>console.log(d&&d.ok?Number(d.rooms)||0:-1)).catch(()=>console.log(-1))' "$ALAMAT/api/health" 2>/dev/null || echo -1
}

server_sehat() { [ "$(jumlah_room)" != "-1" ]; }

tunggu_sehat() {
  local i
  for i in $(seq 1 40); do
    if server_sehat; then return 0; fi
    sleep 1
  done
  return 1
}

# PID yang mendengarkan di $PORT (dipisah spasi; kosong bila tidak ada).
pid_pendengar() {
  if [ "$WINDOWS" = 1 ]; then
    powershell.exe -NoProfile -Command "(Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique) -join ' '" 2>/dev/null | tr -d '\r' || true
  elif command -v lsof >/dev/null 2>&1; then
    lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' || true
  elif command -v ss >/dev/null 2>&1; then
    ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u | tr '\n' ' ' || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "$PORT" 2>/dev/null | tr -s ' ' || true
  fi
}

perintah_pid() {
  if [ "$WINDOWS" = 1 ]; then
    powershell.exe -NoProfile -Command "(Get-CimInstance Win32_Process -Filter 'ProcessId=$1').CommandLine" 2>/dev/null | tr -d '\r' || true
  elif [ -r "/proc/$1/cmdline" ]; then
    tr '\0' ' ' <"/proc/$1/cmdline" || true
  else
    ps -p "$1" -o args= 2>/dev/null || true
  fi
}

matikan_pid() {
  local i
  if [ "$WINDOWS" = 1 ]; then
    taskkill //PID "$1" //F >/dev/null 2>&1 || true
    return 0
  fi
  kill "$1" 2>/dev/null || true
  for i in $(seq 1 10); do
    if ! kill -0 "$1" 2>/dev/null; then return 0; fi
    sleep 1
  done
  kill -9 "$1" 2>/dev/null || true
}

# Bebaskan $PORT, TETAPI hanya dari proses server game ini.
bebaskan_port() {
  local pids pid cmd i
  pids="$(pid_pendengar)"
  if [ -z "${pids// /}" ]; then return 0; fi
  for pid in $pids; do
    cmd="$(perintah_pid "$pid")"
    case "$cmd" in
      *dist/server/src/index.js* | *'dist\server\src\index.js'*)
        info "menghentikan server lama (PID $pid)"
        matikan_pid "$pid"
        ;;
      *)
        gagal "Port $PORT dipakai proses lain (PID $pid: ${cmd:-tidak dikenal}). Skrip ini tidak mematikan program yang bukan server game. Hentikan sendiri atau ganti PORT di .env."
        ;;
    esac
  done
  for i in $(seq 1 15); do
    pids="$(pid_pendengar)"
    if [ -z "${pids// /}" ]; then return 0; fi
    sleep 1
  done
  gagal "Port $PORT masih terpakai setelah server lama dihentikan."
}

SUDO=""
if [ "$WINDOWS" = 0 ] && [ "$(id -u)" != "0" ]; then SUDO="sudo"; fi

pengelola() {
  if [ -n "${RAKSA_PENGELOLA:-}" ]; then
    printf '%s' "$RAKSA_PENGELOLA"
  elif [ "$WINDOWS" = 0 ] && command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "$NAMA.service" 2>/dev/null | grep -q "^$NAMA\.service"; then
    printf 'systemd'
  elif command -v pm2 >/dev/null 2>&1; then
    printf 'pm2'
  else
    printf 'latar'
  fi
}

hentikan_server() {
  case "$(pengelola)" in
    systemd) $SUDO systemctl stop "$NAMA" || true ;;
    pm2) pm2 stop "$NAMA" >/dev/null 2>&1 || true ;;
    latar) ;;
    *) gagal "RAKSA_PENGELOLA tidak dikenal: $(pengelola) (pilih systemd, pm2, atau latar)" ;;
  esac
  # Apa pun pengelolanya, pastikan port benar-benar kosong (mis. sisa `npm start` manual).
  bebaskan_port
}

jalankan_server() {
  if [ ! -f "$AKAR/server/$ENTRI" ]; then gagal "Belum ada hasil build (server/$ENTRI). Jalankan ./deploy.sh dulu."; fi
  case "$(pengelola)" in
    systemd)
      $SUDO systemctl start "$NAMA"
      ;;
    pm2)
      if pm2 describe "$NAMA" >/dev/null 2>&1; then
        pm2 restart "$NAMA" --update-env >/dev/null
      else
        NODE_ENV=production pm2 start "$AKAR/server/$ENTRI" --name "$NAMA" --cwd "$AKAR/server" >/dev/null
      fi
      pm2 save >/dev/null 2>&1 || true
      ;;
    latar)
      mkdir -p "$DIR_DEPLOY"
      printf '\n===== %s  mulai (commit %s) =====\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$(git rev-parse --short HEAD 2>/dev/null || echo '?')" >>"$LOG"
      if [ "$WINDOWS" = 1 ]; then
        # Di Git Bash, program Windows yang dijalankan dengan `&` tetap terikat ke bash peluncurnya:
        # skrip tidak selesai bila keluarannya di-pipe, dan server ikut mati saat jendela ditutup.
        # Start-Process membuat proses yang benar-benar lepas; cmd menangani `>> log`.
        NODE_ENV=production powershell.exe -NoProfile -Command \
          "Start-Process -FilePath 'cmd.exe' -ArgumentList '/d','/c','node $ENTRI >> \"$(cygpath -w "$LOG")\" 2>&1' -WorkingDirectory '$(cygpath -w "$AKAR/server")' -WindowStyle Hidden"
      else
        (cd "$AKAR/server" && NODE_ENV=production nohup node "$ENTRI" </dev/null >>"$LOG" 2>&1 &)
      fi
      ;;
  esac
}

cadangkan_data() {
  local db dir tujuan ekor lama
  db="$(nilai_env DB_FILE ./data/raksa-game.db)"
  case "$db" in /* | [A-Za-z]:*) ;; *) db="$AKAR/${db#./}" ;; esac
  dir="$(dirname "$db")"
  if [ ! -f "$db" ]; then
    info "belum ada database ($db), cadangan dilewati"
    return 0
  fi
  tujuan="$dir/cadangan/$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$tujuan"
  cp -p "$db" "$tujuan/"
  for ekor in -wal -shm; do
    if [ -f "$db$ekor" ]; then cp -p "$db$ekor" "$tujuan/"; fi
  done
  if [ -d "$dir/gambar-soal" ]; then cp -rp "$dir/gambar-soal" "$tujuan/"; fi
  oke "data dicadangkan ke ${tujuan#"$AKAR"/}"
  # Simpan hanya beberapa cadangan terakhir.
  { ls -1d "$dir/cadangan"/*/ 2>/dev/null || true; } | sort -r | awk -v n="$JUMLAH_CADANGAN" 'NR>n' | while IFS= read -r lama; do
    case "$lama" in */cadangan/*) rm -rf "$lama" ;; esac
  done
}

pasang_dependensi() {
  langkah "Memasang dependensi (npm ci)"
  # --include=dev: build butuh vite & tsc walau NODE_ENV=production terpasang di lingkungan.
  if ! npm ci --include=dev --no-audit --no-fund; then
    awas "npm ci gagal (package-lock tidak sinkron?). Mencoba npm install."
    npm install --include=dev --no-audit --no-fund
  fi
}

perlu_pasang() { # perlu_pasang COMMIT_LAMA COMMIT_BARU
  if [ ! -d "$AKAR/node_modules" ]; then return 0; fi
  if [ "$1" != "$2" ] && git diff --name-only "$1" "$2" | grep -qE '(^|/)package(-lock)?\.json$'; then return 0; fi
  return 1
}

ringkasan() {
  local cfg
  cfg="$(node -e 'fetch(process.argv[1],{signal:AbortSignal.timeout(4000)}).then(r=>r.json()).then(d=>console.log([d.joinBaseUrl||"",d.paketBawaan||"",d.totalRounds||"",d.butuhPin?"ya":"tidak"].join("|"))).catch(()=>console.log("|||"))' "$ALAMAT/api/config" 2>/dev/null || echo '|||')"
  local url paket ronde pin
  IFS='|' read -r url paket ronde pin <<<"$cfg"
  info "versi    : $(git log -1 --format='%h  %s' 2>/dev/null)"
  info "alamat   : ${url:-$ALAMAT}   (host: ${url:-$ALAMAT}/host)"
  info "paket    : ${paket:-?} (${ronde:-?} soal)   pengelola proses: $(pengelola)"
  if [ "$pin" = "tidak" ]; then
    awas "PANITIA_PIN belum dipasang di .env: siapa pun di jaringan bisa membuka /host dan bank soal."
  fi
}

# ------------------------------------------------------------------ perintah kecil

perintah_status() {
  langkah "Status"
  info "folder   : $AKAR"
  info "versi    : $(git log -1 --format='%h  %s  (%cr)' 2>/dev/null || echo 'bukan repo git')"
  local n
  n="$(jumlah_room)"
  if [ "$n" = "-1" ]; then
    awas "server TIDAK menjawab di $ALAMAT"
    return 1
  fi
  oke "server hidup di $ALAMAT, room hidup: $n"
  ringkasan
}

perintah_stop() {
  langkah "Menghentikan server"
  local n
  n="$(jumlah_room)"
  if [ "$n" != "-1" ] && [ "$n" != "0" ] && [ "$PAKSA" != 1 ]; then
    gagal "Masih ada $n room hidup. Menghentikan server memutus semua pemain. Ulangi dengan --paksa bila memang itu maksudnya."
  fi
  hentikan_server
  oke "server berhenti"
}

perintah_start() {
  langkah "Menjalankan server"
  if server_sehat; then
    oke "server sudah hidup di $ALAMAT"
    return 0
  fi
  bebaskan_port
  jalankan_server
  if ! tunggu_sehat; then gagal "Server tidak menjawab di $ALAMAT. Lihat log: ./deploy.sh log"; fi
  oke "server hidup"
  ringkasan
}

perintah_log() {
  case "$(pengelola)" in
    systemd) exec $SUDO journalctl -u "$NAMA" -f -n 80 ;;
    pm2) exec pm2 logs "$NAMA" --lines 80 ;;
    *)
      if [ ! -f "$LOG" ]; then gagal "Belum ada log di $LOG"; fi
      exec tail -n 80 -f "$LOG"
      ;;
  esac
}

# ------------------------------------------------------------------ deploy

SEBELUM=""
SEDANG_PULIH=0

# Kembalikan kode ke commit sebelum deploy, build ulang, jalankan lagi. Dipanggil saat build/start gagal.
pulihkan() {
  local alasan="$1"
  if [ "$ROLLBACK" != 1 ] || [ "$SEDANG_PULIH" = 1 ] || [ -z "$SEBELUM" ] || [ "$SEBELUM" = "$(git rev-parse HEAD)" ]; then
    gagal "$alasan"
  fi
  SEDANG_PULIH=1
  local gagal_di
  gagal_di="$(git rev-parse HEAD)"
  langkah "Deploy gagal: kembali ke versi sebelumnya (${SEBELUM:0:7})"
  awas "$alasan"
  git reset --hard "$SEBELUM" >/dev/null
  if perlu_pasang "$gagal_di" "$SEBELUM"; then pasang_dependensi; fi
  if ! npm run build; then gagal "Versi lama pun gagal di-build. Periksa manual. ($alasan)"; fi
  hentikan_server
  jalankan_server
  if tunggu_sehat; then
    oke "versi lama (${SEBELUM:0:7}) berjalan lagi"
  else
    awas "versi lama sudah dipulihkan tetapi server tidak menjawab; lihat ./deploy.sh log"
  fi
  gagal "Deploy DIBATALKAN. Commit ${gagal_di:0:7} bermasalah: $alasan"
}

perintah_deploy() {
  langkah "Memeriksa prasyarat"
  local alat
  for alat in git node npm; do
    if ! command -v "$alat" >/dev/null 2>&1; then gagal "'$alat' tidak ditemukan di PATH."; fi
  done
  if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=11)?0:1)'; then
    gagal "Butuh Node.js >= 20.11 (terpasang: $(node -v))."
  fi
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then gagal "$AKAR bukan repo git."; fi
  if [ ! -f "$AKAR/.env" ]; then
    cp "$AKAR/.env.example" "$AKAR/.env"
    awas ".env belum ada: dibuat dari .env.example. Periksa PUBLIC_BASE_URL dan PANITIA_PIN."
  fi
  oke "git, node $(node -v), npm $(npm -v) | port $PORT | pengelola: $(pengelola)"

  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    if [ "$STASH" = 1 ]; then
      git stash push -m "deploy.sh $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null
      awas "perubahan lokal disimpan ke git stash (lihat: git stash list)"
    else
      git status --short --untracked-files=no | sed 's/^/      /'
      gagal "Ada perubahan lokal yang belum di-commit. Commit dulu, atau ulangi dengan --stash."
    fi
  fi

  local n
  n="$(jumlah_room)"
  if [ "$n" != "-1" ] && [ "$n" != "0" ]; then
    if [ "$PAKSA" = 1 ]; then
      awas "$n room hidup akan HILANG dan semua pemainnya terputus (--paksa)."
    else
      gagal "Masih ada $n room hidup di server. Restart menghapus semua room dan memutus pemain. Tunggu acara selesai, atau ulangi dengan --paksa."
    fi
  fi

  langkah "Menarik kode terbaru (git pull)"
  local cabang
  cabang="${CABANG:-$(git rev-parse --abbrev-ref HEAD)}"
  if [ "$cabang" = "HEAD" ]; then gagal "HEAD terlepas (detached). Sebutkan cabangnya: ./deploy.sh --cabang main"; fi
  SEBELUM="$(git rev-parse HEAD)"
  git fetch --prune origin
  if [ "$cabang" != "$(git rev-parse --abbrev-ref HEAD)" ]; then git checkout "$cabang"; fi
  if ! git pull --ff-only origin "$cabang"; then
    gagal "git pull tidak bisa fast-forward (riwayat lokal berbeda dari origin/$cabang). Selesaikan manual, lalu ulangi."
  fi
  local sesudah
  sesudah="$(git rev-parse HEAD)"
  if [ "$SEBELUM" = "$sesudah" ]; then
    info "tidak ada commit baru (${sesudah:0:7})"
    if [ "$BUILD_ULANG" != 1 ] && [ -f "$AKAR/server/$ENTRI" ] && [ -f "$AKAR/client/dist/index.html" ]; then
      if server_sehat; then
        oke "sudah versi terbaru dan server hidup. Tidak ada yang perlu dilakukan (--build-ulang untuk memaksa)."
        ringkasan
        return 0
      fi
      awas "server tidak hidup: dijalankan dari build yang ada"
      perintah_start
      return 0
    fi
  else
    oke "${SEBELUM:0:7} -> ${sesudah:0:7}"
    git log --oneline --no-decorate "$SEBELUM..$sesudah" | head -n 15 | sed 's/^/      /'
  fi

  if perlu_pasang "$SEBELUM" "$sesudah"; then
    # Windows mengunci better_sqlite3.node selama server hidup: hentikan dulu sebelum npm ci.
    if [ "$WINDOWS" = 1 ]; then hentikan_server; fi
    pasang_dependensi || pulihkan "pemasangan dependensi gagal"
  else
    info "dependensi tidak berubah, npm ci dilewati"
  fi

  if [ "$TES" = 1 ]; then
    langkah "Menjalankan tes (npm test)"
    npm test || pulihkan "npm test gagal"
  fi

  langkah "Build (client + server)"
  npm run build || pulihkan "build gagal"

  langkah "Restart server"
  hentikan_server
  cadangkan_data
  jalankan_server
  if ! tunggu_sehat; then pulihkan "server tidak menjawab di $ALAMAT setelah restart"; fi
  oke "server hidup di $ALAMAT"

  langkah "Selesai"
  ringkasan
}

# ------------------------------------------------------------------ argumen

PERINTAH="deploy"
TES=0; PAKSA=0; BUILD_ULANG=0; STASH=0; ROLLBACK=1; CABANG=""
while [ $# -gt 0 ]; do
  case "$1" in
    deploy | status | stop | start | log) PERINTAH="$1" ;;
    --tes) TES=1 ;;
    --paksa) PAKSA=1 ;;
    --build-ulang) BUILD_ULANG=1 ;;
    --stash) STASH=1 ;;
    --tanpa-rollback) ROLLBACK=0 ;;
    --cabang)
      shift
      CABANG="${1:-}"
      if [ -z "$CABANG" ]; then gagal "--cabang butuh nama cabang"; fi
      ;;
    -h | --help | bantuan)
      sed -n '2,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) gagal "Argumen tidak dikenal: $1 (lihat ./deploy.sh --help)" ;;
  esac
  shift
done

case "$PERINTAH" in
  deploy) perintah_deploy ;;
  status) perintah_status ;;
  stop) perintah_stop ;;
  start) perintah_start ;;
  log) perintah_log ;;
esac
