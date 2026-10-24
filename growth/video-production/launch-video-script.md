# Heir of Wisdom — Launch Video Script
**Total Duration:** 60 seconds  
**Format:** 1080×1350 vertical (9:16) — Instagram Reels / TikTok / YouTube Shorts  
**Tone:** Calm, architectural, confident, editorial  
**Voice:** Warm, adult, editorial — not hype-y  
**Music:** Ambient, minimal piano + subtle synth (royalty-free)  

---

## Script

| Time | Visual | Audio (Voiceover) | On-Screen Text |
|------|--------|-------------------|----------------|
| 0:00–0:05 | Black screen. A single dark navy arrow rotates slowly in center of sand-colored canvas. | "Most apps mark wrong answers red." | *None* |
| 0:05–0:10 | Arrow splits into three arrows, each rotating differently. Compass-like geometry emerges. | "They memorize the pattern, not the rule." | *None* |
| 0:10–0:15 | Arrows dissolve into particles, reform into a clean circle. A child's finger enters frame (hand-drawn SVG line) and touches the circle. | "Heir of Wisdom is different." | "Heir of Wisdom" |
| 0:15–0:20 | Canvas shows a geometric shape. Finger drags it. Shape rotates 90°. Dashed circle shows the path. | "Kids physically rotate, reflect, and scale shapes." | "Physically manipulate shapes" |
| 0:20–0:25 | Canvas shows a complex pattern. Finger taps. The shape transforms to reveal the underlying rule — lines connect, symmetry appears. | "They test hypotheses without penalty." | "Test hypotheses without penalty" |
| 0:25–0:30 | Screen splits. Left: child's hand on canvas. Right: parent dashboard showing hint dependency going DOWN, accuracy going UP. | "The parent dashboard shows hint dependency dropping, accuracy rising." | "Evidence, not guesswork" |
| 0:30–0:35 | Close-up on canvas: a new geometric object appears — completely different from the training shape. The child rotates it, and it snaps into alignment. | "They apply the same rule to completely different shapes." | "Far-transfer: real conceptual mastery" |
| 0:35–0:40 | Logo lockup: "Heir of Wisdom" in Cormorant Garamond, dark navy on sand. Subtle geometric pulse behind it. | "No badges. No streaks. No 'genius' labels." | "No gamified noise" |
| 0:40–0:45 | Logo remains. Small text fades in below. | "Wisdom is inherited. Thinking is discovered." | "Wisdom is inherited. Thinking is discovered." |
| 0:45–0:50 | Same screen. Button fades in: "Start Free Parent Onboarding" in sand pill, navy text. | "Start your child's free session." | "Start Free Parent Onboarding →" |
| 0:50–0:60 | Hold on logo + CTA. URL types out below: hierofwisdom.me | *Silence / music fades out* | "hierofwisdom.me" |

---

## Visual Style Guide

| Element | Specification |
|---------|---------------|
| **Background** | Sand #FAF7F0 |
| **Primary color** | Navy #0E2235 |
| **Accent** | Ochre #B57424 |
| **Typography** | Cormorant Garamond (headings), Inter (UI text) |
| **Motion** | Ease-out cubic-bezier(0.4, 0, 0.2, 1), 60fps |
| **3D objects** | Matte material, soft shadows, contact shadows, translucent layers only when explaining transformation |
| **Camera** | Slow orbital drift, never jerky |
| **Lighting** | Soft daylight, directional from top-left |

---

## Production Pipeline

### Step 1: Generate Voiceover (Kokoro TTS)
```bash
# Install Kokoro TTS (local)
pip install kokoro-tts

# Generate voiceover for each segment
kokoro-tts --text "Most apps mark wrong answers red." --output assets/audio/segment-01.wav --voice af_sarah --speed 1.0
kokoro-tts --text "They memorize the pattern, not the rule." --output assets/audio/segment-02.wav --voice af_sarah --speed 1.0
# ... repeat for all segments
```

### Step 2: Render Motion Graphics (Three.js)
Open `launch-video-visuals.html` in a browser, record screen at 1080×1350, or use Puppeteer/Playwright to capture frames.

### Step 3: Assemble (ffmpeg)
```bash
# Combine video + audio
ffmpeg -i visuals.mp4 -i voiceover.wav -c:v copy -c:a aac -shortest final-video.mp4

# Add subtitles/captions if needed
ffmpeg -i final-video.mp4 -vf subtitles=subs.srt final-with-subs.mp4
```

### Step 4: Export Formats
- **1080×1350 MP4** — Instagram Reels, TikTok, YouTube Shorts
- **1080×1080 MP4** — Instagram Feed
- **1920×1080 MP4** — Website hero, YouTube

---

## File Structure

```
growth/video-production/
├── launch-video-script.md          # This file
├── launch-video-visuals.html       # Three.js motion graphics scene
├── kokoro-tts-script.js            # Node script to batch-generate TTS
├── ffmpeg-assemble.sh              # Shell script to combine video+audio
├── assets/
│   ├── audio/                      # Generated WAV files
│   ├── video/                      # Rendered MP4 segments
│   └── exports/                    # Final deliverables
└── README.md                       # Production instructions
```

---

## Approval Checklist (Before Publishing)

- [ ] Voiceover recorded and sounds natural (not robotic)
- [ ] Visuals match script timing (±0.5s per segment)
- [ ] No forbidden words spoken or shown (genius, IQ boost, drill, gamify, guaranteed)
- [ ] CTA links to correct URL with UTM parameters
- [ ] Video renders cleanly at 1080×1350
- [ ] User says "unleash out-reach" or "deploy out-reach"

---

**Nothing is published yet.** This is the production blueprint. Say "unleash out-reach" or "deploy out-reach" when you're ready to proceed to rendering and publishing.
