#!/usr/bin/env bash
# Re-encode site media for web delivery (run from opus-landing-demo/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v ffmpeg >/dev/null || { echo "ffmpeg required (brew install ffmpeg)"; exit 1; }

MAX_W_VIDEO=1280
CRF=28
IMG_MAX_PX=1920
IMG_JPEG_Q=82

optimize_mp4() {
  local f="$1"
  local tmp="${f}.opt.mp4"
  local w
  w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$f" 2>/dev/null || echo 0)
  local vf="scale='min(${MAX_W_VIDEO},iw)':-2"
  if [[ "${w}" -le "${MAX_W_VIDEO}" && "${w}" -gt 0 ]]; then
    vf="scale=iw:ih"
  fi
  ffmpeg -y -hide_banner -loglevel error -i "$f" \
    -vf "${vf}" \
    -c:v libx264 -preset medium -crf "${CRF}" -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "${tmp}"
  mv "${tmp}" "$f"
}

optimize_image() {
  local f="$1"
  local ext="${f##*.}"
  local lower
  lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
  if [[ "$lower" == "jpg" || "$lower" == "jpeg" ]]; then
    sips -Z "${IMG_MAX_PX}" "$f" >/dev/null
    sips -s format jpeg -s formatOptions "${IMG_JPEG_Q}" "$f" >/dev/null
  elif [[ "$lower" == "png" ]]; then
    sips -Z "${IMG_MAX_PX}" "$f" >/dev/null
  fi
}

echo "Optimizing videos under assets/ (max width ${MAX_W_VIDEO}, CRF ${CRF})…"
find assets -type f \( -iname '*.mp4' -o -iname '*.MP4' \) ! -path '*/_archive/*' | while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  size=$(stat -f%z "$f")
  if [[ "$size" -lt 800000 ]]; then
    continue
  fi
  echo "  video: $f (${size} bytes)"
  optimize_mp4 "$f"
done

echo "Optimizing large images (max ${IMG_MAX_PX}px, JPEG q=${IMG_JPEG_Q})…"
find assets -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.JPG' -o -iname '*.png' \) ! -path '*/_archive/*' ! -path '*/wire/*' | while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  [[ -L "$f" ]] && continue
  size=$(stat -f%z "$f")
  if [[ "$size" -lt 450000 ]]; then
    continue
  fi
  echo "  image: $f"
  optimize_image "$f"
done

echo "Done. Run: du -sh assets/media assets/pillars"
