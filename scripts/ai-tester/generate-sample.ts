import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample test case - similar to your real screenshot
const testCase = {
  symbol: "NQH2026",
  timeframe: "5",
  exchange: "CME_MINI",
  direction: "SHORT",
  entryPrice: 21402.00,
  stopLoss: 21428.00,
  takeProfit: 21168.75,
  riskReward: 7.27,
  date: "2026-01-20",
  time: "13:49",
  outcome: "OPEN"
};

async function generateSample() {
  console.log('Generating sample chart with these values:');
  console.log(JSON.stringify(testCase, null, 2));

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 700 });

  // Load template
  const templatePath = path.join(__dirname, 'chart-template.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');

  // Inject config
  const configScript = `<script>window.CHART_CONFIG = ${JSON.stringify(testCase)};</script>`;
  const htmlWithConfig = templateHtml.replace('</head>', `${configScript}</head>`);

  await page.setContent(htmlWithConfig, { waitUntil: 'networkidle0' });

  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Ensure output dir exists
  const outputDir = path.join(__dirname, 'test-outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'sample-chart.png');
  await page.screenshot({ path: outputPath, type: 'png' });

  console.log(`\nScreenshot saved to: ${outputPath}`);
  console.log('\nGround truth for this chart:');
  console.log(`  Symbol:      ${testCase.symbol}`);
  console.log(`  Direction:   ${testCase.direction}`);
  console.log(`  Entry:       ${testCase.entryPrice}`);
  console.log(`  Stop Loss:   ${testCase.stopLoss}`);
  console.log(`  Take Profit: ${testCase.takeProfit}`);
  console.log(`  R:R:         ${testCase.riskReward}`);
  console.log(`  Outcome:     ${testCase.outcome}`);

  await browser.close();
}

generateSample().catch(console.error);
