# Heir of Wisdom — Launch Video Production

## What's here

| File | Purpose |
|------|---------|
| `launch-video-script.md` | Full script, timing, and production notes |
| `launch-video-visuals.html` | Three.js motion graphics scene (open in browser, record screen) |
| `kokoro-tts-script.js` | Node script to generate voiceover audio via Kokoro TTS |
| `ffmpeg-assemble.sh` | Shell script to combine video + audio into final MP4 |
| `README.md` | This file |

## Prerequisites

1. **Node.js** — for running kokoro-tts-script.js
2. **Python + kokoro-tts** — for local TTS generation:
   ```bash
   pip install kokoro-tts
   python -m kokoro_tts.download_model
   ```
3. **FFmpeg** — for video/audio assembly:
   ```bash
   # macOS
   brew install ffmpeg
   # Ubuntu/Debian
   sudo apt install ffmpeg
   # Windows
   # Download from ffmpeg.org
   ```
4. **Browser** — Chrome/Edge to render the Three.js scene at 1080×1350
5. **Screen recording** — OBS, QuickTime, or similar to capture the HTML visuals

## Production Steps

### 1. Render the visuals
Open `launch-video-visuals.html` in a browser at 1080×1350 resolution. Record the screen as the animation plays (it auto-advances through 11 scenes, ~60 seconds total). Save as `assets/video/visuals.mp4`.

### 2. Generate audio
```bash
node kokoro-tts-script.js
```
This creates `assets/audio/segment-01.wav` through `segment-10.wav`.

### 3. Assemble final video
```bash
chmod +x ffmpeg-assemble.sh
./ffmpeg-assemble.sh
```
Output: `assets/exports/heir-of-wisdom-launch.mp4`

### 4. Review
Watch the exported MP4. Check:
- [ ] Audio and video are in sync
- [ ] Text overlays appear at the right time
- [ ] CTA button appears on the correct scene
- [ ] URL displays correctly
- [ ] No forbidden words spoken or shown

### 5. Publish (only after user approval)
- Instagram Reels (1080×1350)
- TikTok (1080×1350)
- YouTube Shorts (1080×1350)
- Website hero section (looping, muted)

---

## Current Status

| Asset | Status |
|-------|--------|
| Video script | ✅ Written |
| Three.js visuals | ✅ Coded (HTML file) |
| Kokoro TTS script | ✅ Written |
| FFmpeg assembly script | ✅ Written |
| Rendered video (MP4) | ❌ Not yet rendered |
| Published | ❌ Not published |

**Stop condition:** Nothing publishes until you say "unleash out-reach" or "deploy out-reach."
