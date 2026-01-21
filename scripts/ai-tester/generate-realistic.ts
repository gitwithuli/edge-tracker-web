import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Symbol configs with realistic price ranges
const SYMBOLS = [
  { symbol: 'NQH2026', range: [21000, 22000], tick: 0.25 },
  { symbol: 'ESH2026', range: [5900, 6100], tick: 0.25 },
  { symbol: 'NQ1!', range: [21000, 22000], tick: 0.25 },
  { symbol: 'ES1!', range: [5900, 6100], tick: 0.25 },
];

function generateRandomTestCase() {
  const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const direction = Math.random() > 0.5 ? 'LONG' : 'SHORT';

  const entryPrice = sym.range[0] + Math.random() * (sym.range[1] - sym.range[0]);
  const riskPoints = 15 + Math.random() * 35;  // 15-50 points
  const rrRatio = 1.5 + Math.random() * 4;     // 1.5R to 5.5R (more realistic)
  const targetPoints = riskPoints * rrRatio;

  const roundToTick = (p: number) => Math.round(p / sym.tick) * sym.tick;

  return {
    symbol: sym.symbol,
    direction,
    entryPrice: roundToTick(entryPrice),
    stopLoss: roundToTick(direction === 'LONG' ? entryPrice - riskPoints : entryPrice + riskPoints),
    takeProfit: roundToTick(direction === 'LONG' ? entryPrice + targetPoints : entryPrice - targetPoints),
    riskReward: Math.round(rrRatio * 100) / 100,
  };
}

async function generateRealisticChart() {
  const testCase = generateRandomTestCase();

  console.log('═'.repeat(50));
  console.log('GENERATING REALISTIC TRADINGVIEW CHART');
  console.log('═'.repeat(50));
  console.log('\n📊 Ground Truth Values:');
  console.log(`   Symbol:      ${testCase.symbol}`);
  console.log(`   Direction:   ${testCase.direction}`);
  console.log(`   Entry:       ${testCase.entryPrice.toFixed(2)}`);
  console.log(`   Stop Loss:   ${testCase.stopLoss.toFixed(2)}`);
  console.log(`   Take Profit: ${testCase.takeProfit.toFixed(2)}`);
  console.log(`   R:R:         ${testCase.riskReward.toFixed(2)}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 700 });

  // Use realistic template with TradingView lightweight-charts
  const templatePath = path.join(__dirname, 'realistic-chart.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');

  // Inject config
  const configScript = `<script>window.CHART_CONFIG = ${JSON.stringify(testCase)};</script>`;
  const htmlWithConfig = templateHtml.replace('</head>', `${configScript}</head>`);

  await page.setContent(htmlWithConfig, { waitUntil: 'networkidle0' });

  // Wait for chart library to render
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Ensure output dir exists
  const outputDir = path.join(__dirname, 'test-outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'realistic-sample.png');
  await page.screenshot({ path: outputPath, type: 'png' });

  console.log(`\n✅ Screenshot saved to: ${outputPath}`);

  // Save ground truth
  fs.writeFileSync(
    path.join(outputDir, 'realistic-sample-truth.json'),
    JSON.stringify(testCase, null, 2)
  );

  await browser.close();
}

generateRealisticChart().catch(console.error);
