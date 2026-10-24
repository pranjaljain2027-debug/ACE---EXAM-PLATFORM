#!/bin/bash
# ============================================================================
# Heir of Wisdom — Launch Video Assembly Script
# Combines rendered visuals + audio into final MP4
# ============================================================================

set -e

VIDEO_DIR="assets/video"
AUDIO_DIR="assets/audio"
OUTPUT_DIR="assets/exports"
OUTPUT_FILE="heir-of-wisdom-launch.mp4"
TEMP_DIR="/tmp/hev-video-temp"

mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "🎬 Heir of Wisdom — Launch Video Assembly"
echo "=========================================="

# Step 1: Verify inputs
if [ ! -f "$VIDEO_DIR/visuals.mp4" ]; then
  echo "❌ Error: $VIDEO_DIR/visuals.mp4 not found."
  echo "   Render the Three.js scene to video first."
  exit 1
fi

if [ ! -f "$AUDIO_DIR/segment-01.wav" ]; then
  echo "❌ Error: Audio files not found in $AUDIO_DIR/"
  echo "   Run kokoro-tts-script.js first."
  exit 1
fi

echo "✓ Input files found"

# Step 2: Concatenate all audio segments into one track
echo "🎧 Combining audio segments..."
cat "$AUDIO_DIR"/segment-*.wav > "$TEMP_DIR/full-audio.wav"

# Step 3: Combine video + audio
echo "🎥 Muxing video and audio..."
ffmpeg -y \
  -i "$VIDEO_DIR/visuals.mp4" \
  -i "$TEMP_DIR/full-audio.wav" \
  -c:v copy \
  -c:a aac \
  -b:a 192k \
  -shortest \
  "$OUTPUT_DIR/$OUTPUT_FILE"

echo "✅ Video exported: $OUTPUT_DIR/$OUTPUT_FILE"

# Step 4: Show file info
echo ""
echo "📊 Output file:"
ls -lh "$OUTPUT_DIR/$OUTPUT_FILE"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "$OUTPUT_DIR/$OUTPUT_FILE"

echo ""
echo "🚀 Ready to publish!"
echo "   File: $OUTPUT_DIR/$OUTPUT_FILE"
echo "   Format: MP4 (1080x1350, 9:16)"
echo "   Platforms: Instagram Reels, TikTok, YouTube Shorts, Website Hero"
