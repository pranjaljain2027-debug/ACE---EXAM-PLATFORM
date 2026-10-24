#!/usr/bin/env node
/**
 * Kokoro TTS Batch Generator for Heir of Wisdom Launch Video
 * 
 * Prerequisites:
 *   pip install kokoro-tts
 *   python -m kokoro_tts.download_model
 *
 * Usage:
 *   node kokoro-tts-script.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'assets', 'audio');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SCRIPT_SEGMENTS = [
  { id: 0, text: 'Most apps mark wrong answers red.', file: 'segment-01.wav' },
  { id: 1, text: 'They memorize the pattern, not the rule.', file: 'segment-02.wav' },
  { id: 2, text: 'Heir of Wisdom is different.', file: 'segment-03.wav' },
  { id: 3, text: 'Kids physically rotate, reflect, and scale shapes.', file: 'segment-04.wav' },
  { id: 4, text: 'They test hypotheses without penalty.', file: 'segment-05.wav' },
  { id: 5, text: 'The parent dashboard shows hint dependency dropping, accuracy rising.', file: 'segment-06.wav' },
  { id: 6, text: 'They apply the same rule to completely different shapes.', file: 'segment-07.wav' },
  { id: 7, text: 'No badges. No streaks. No genius labels.', file: 'segment-08.wav' },
  { id: 8, text: 'Wisdom is inherited. Thinking is discovered.', file: 'segment-09.wav' },
  { id: 9, text: 'Start your child\'s free session.', file: 'segment-10.wav' }
];

const VOICE = 'af_sarah'; // Kokoro female voice, warm and clear
const SPEED = 1.0;

console.log('🎙️  Kokoro TTS Batch Generator\n');
console.log(`Output directory: ${OUTPUT_DIR}`);
console.log(`Voice: ${VOICE}, Speed: ${SPEED}\n`);

SCRIPT_SEGMENTS.forEach((segment, index) => {
  const outputPath = path.join(OUTPUT_DIR, segment.file);
  
  // Escape text for shell
  const escapedText = segment.text.replace(/'/g, "\\'").replace(/"/g, '\\"');
  
  const command = `python -m kokoro_tts --text '${escapedText}' --output '${outputPath}' --voice '${VOICE}' --speed ${SPEED}`;
  
  try {
    console.log(`[${index + 1}/${SCRIPT_SEGMENTS.length}] Generating: ${segment.file}`);
    execSync(command, { stdio: 'pipe' });
    console.log(`   ✓ Saved to ${outputPath}`);
  } catch (err) {
    console.error(`   ✗ Failed: ${segment.file}`);
    console.error(err.stderr || err.message);
  }
});

console.log('\n✅ All segments generated.');
console.log(`\nNext step: Combine with video using ffmpeg-assemble.sh`);
