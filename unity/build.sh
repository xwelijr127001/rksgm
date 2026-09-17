#!/usr/bin/env bash
# Build Unity Web untuk RAKSA GAME (macOS / Linux).
#
#   bash unity/build.sh
#   bash unity/build.sh --brotli
#   RAKSA_UNITY=/Applications/Unity/Hub/Editor/6000.3.10f1/Unity.app/Contents/MacOS/Unity bash unity/build.sh
#
# Hasil build: unity/Build/Web (disajikan server di /unity/)

set -euo pipefail

PROJECT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="${PROJECT_PATH}/Build/Web"
LOG="${PROJECT_PATH}/build-web.log"
BROTLI=""
NOFALLBACK=""
GENERATE_ONLY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --brotli) BROTLI="-raksaBrotli" ;;
    --no-fallback) NOFALLBACK="-raksaNoFallback" ;;
    --generate-only) GENERATE_ONLY="1" ;;
    --output) OUTPUT="$2"; shift ;;
    *) echo "opsi tidak dikenal: $1" >&2; exit 64 ;;
  esac
  shift
done

pinned="$(grep 'm_EditorVersion:' "${PROJECT_PATH}/ProjectSettings/ProjectVersion.txt" | sed 's/m_EditorVersion:[[:space:]]*//' | tr -d '\r')"

find_unity() {
  if [[ -n "${RAKSA_UNITY:-}" && -x "${RAKSA_UNITY}" ]]; then
    echo "${RAKSA_UNITY}"; return 0
  fi
  local roots=(
    "/Applications/Unity/Hub/Editor"
    "${HOME}/Unity/Hub/Editor"
    "/opt/unity/editors"
  )
  local exact="" same="" any=""
  for r in "${roots[@]}"; do
    [[ -d "$r" ]] || continue
    for d in "$r"/*; do
      [[ -d "$d" ]] || continue
      local exe=""
      if [[ -x "$d/Unity.app/Contents/MacOS/Unity" ]]; then exe="$d/Unity.app/Contents/MacOS/Unity"
      elif [[ -x "$d/Editor/Unity" ]]; then exe="$d/Editor/Unity"
      else continue; fi
      local v; v="$(basename "$d")"
      any="$exe"
      [[ "$v" == "$pinned" ]] && exact="$exe"
      [[ "$v" == 6000.3.* ]] && same="$exe"
    done
  done
  if [[ -n "$exact" ]]; then echo "$exact"; return 0; fi
  if [[ -n "$same" ]]; then echo "$same" ; return 0; fi
  if [[ -n "$any"  ]]; then echo "$any"  ; return 0; fi
  return 1
}

if ! UNITY="$(find_unity)"; then
  cat >&2 <<'MSG'

Unity Editor tidak ditemukan.

Yang dibutuhkan:
  1. Unity Hub               : https://unity.com/download
  2. Unity 6000.3.x LTS + modul Web Build Support:
       unity install lts -m webgl
  3. Lisensi Unity (Personal gratis) - harus disetujui lewat Unity Hub.

Sudah terpasang tetapi tidak terdeteksi? Set path-nya:
  export RAKSA_UNITY="/Applications/Unity/Hub/Editor/6000.3.10f1/Unity.app/Contents/MacOS/Unity"

MSG
  exit 2
fi

METHOD="Raksa.EditorTools.RaksaBuildWeb.BuildFromCommandLine"
[[ -n "$GENERATE_ONLY" ]] && METHOD="Raksa.EditorTools.RaksaSceneGenerator.GenerateFromCommandLine"

echo "Unity   : ${UNITY}"
echo "Project : ${PROJECT_PATH}"
echo "Output  : ${OUTPUT}"
echo "Log     : ${LOG}"
echo
echo "Menjalankan Unity (batchmode). Build pertama bisa 10-30 menit..."

set +e
"${UNITY}" -batchmode -nographics -quit \
  -projectPath "${PROJECT_PATH}" \
  -executeMethod "${METHOD}" \
  -logFile "${LOG}" \
  -raksaOutput "${OUTPUT}" \
  ${BROTLI} ${NOFALLBACK}
code=$?
set -e

if [[ $code -ne 0 ]]; then
  echo >&2
  echo "Build GAGAL (exit ${code}). Baris error terakhir:" >&2
  [[ -f "$LOG" ]] && tail -n 400 "$LOG" | grep -Ei "error|exception|failed" | tail -n 25 >&2 || true
  exit $code
fi

echo
echo "Build selesai."
if [[ -z "$GENERATE_ONLY" && -d "$OUTPUT" ]]; then
  du -sh "$OUTPUT" 2>/dev/null || true
  ls -lhS "${OUTPUT}/Build" 2>/dev/null | head -n 9 || true
  echo
  echo "Server menyajikannya di /unity/ (lihat UNITY_BUILD_DIR di .env.example)."
fi
