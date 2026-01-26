const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '..', 'out', 'videos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const compositions = [
  'Demo-Vertical-TikTok-Reels-Shorts-30s-Quick-Teaser',
  'Demo-Vertical-TikTok-Reels-Shorts-45s-Standard-Demo',
  'Demo-Vertical-TikTok-Reels-Shorts-60s-Full-Walkthrough',
  'Demo-Horizontal-YouTube-Twitter-LinkedIn-30s-Quick-Teaser',
  'Demo-Horizontal-YouTube-Twitter-LinkedIn-45s-Standard-Demo',
  'Demo-Horizontal-YouTube-Twitter-LinkedIn-60s-Full-Walkthrough',
  'Demo-Square-Instagram-Twitter-30s-Quick-Teaser',
  'Demo-Square-Instagram-Twitter-45s-Standard-Demo',
  'Demo-Square-Instagram-Twitter-60s-Full-Walkthrough',
];

console.log(`Rendering ${compositions.length} videos to ${outputDir}...\n`);

compositions.forEach((comp, index) => {
  const outputPath = path.join(outputDir, `${comp}.mp4`);
  console.log(`[${index + 1}/${compositions.length}] Rendering: ${comp}`);

  try {
    execSync(
      `npx remotion render remotion/index.tsx ${comp} ${outputPath} --codec h264`,
      {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      }
    );
    console.log(`  Saved: ${outputPath}\n`);
  } catch (error) {
    console.error(`  Failed to render ${comp}: ${error.message}\n`);
  }
});

console.log('Done!');
