import puppeteer, { Browser } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../../.env.local') });

// Types
interface TestCase {
  symbol: string;
  timeframe: string;
  exchange: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  date: string;
  time: string;
  outcome: 'WIN' | 'LOSS' | 'OPEN';
}

interface ParsedResult {
  symbol: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  date: string;
  time: string;
  outcome: string;
  confidence: number;
}

interface TestResult {
  testCase: TestCase;
  parsed: ParsedResult | null;
  errors: string[];
  accuracy: {
    symbol: boolean;
    direction: boolean;
    entryPrice: { correct: boolean; diff: number; pctDiff: number };
    stopLoss: { correct: boolean; diff: number; pctDiff: number };
    takeProfit: { correct: boolean; diff: number; pctDiff: number };
    riskReward: { correct: boolean; diff: number };
    outcome: boolean;
  };
  overallScore: number;
}

// Symbol configurations with typical price ranges
const SYMBOLS = [
  { symbol: 'NQH2026', exchange: 'CME_MINI', priceRange: [21000, 22000], tickSize: 0.25 },
  { symbol: 'ESH2026', exchange: 'CME_MINI', priceRange: [5900, 6100], tickSize: 0.25 },
  { symbol: 'NQ1!', exchange: 'CME_MINI', priceRange: [21000, 22000], tickSize: 0.25 },
  { symbol: 'ES1!', exchange: 'CME_MINI', priceRange: [5900, 6100], tickSize: 0.25 },
  { symbol: 'MNQ1!', exchange: 'CME_MINI', priceRange: [21000, 22000], tickSize: 0.25 },
  { symbol: 'MES1!', exchange: 'CME_MINI', priceRange: [5900, 6100], tickSize: 0.25 },
];

const TIMEFRAMES = ['1', '5', '15', '30', '60', '240', 'D'];
const OUTCOMES = ['WIN', 'LOSS', 'OPEN'] as const;

// Generate a random test case
function generateTestCase(): TestCase {
  const symbolConfig = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const direction: 'LONG' | 'SHORT' = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const timeframe = TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)];
  const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];

  // Generate realistic prices
  const [minPrice, maxPrice] = symbolConfig.priceRange;
  const entryPrice = minPrice + Math.random() * (maxPrice - minPrice);

  // Round to tick size
  const roundToTick = (price: number) => {
    return Math.round(price / symbolConfig.tickSize) * symbolConfig.tickSize;
  };

  // Generate stop loss and take profit
  const riskPoints = 10 + Math.random() * 40; // 10-50 points risk
  const riskReward = 1 + Math.random() * 9; // 1R to 10R
  const targetPoints = riskPoints * riskReward;

  let stopLoss: number;
  let takeProfit: number;

  if (direction === 'LONG') {
    stopLoss = roundToTick(entryPrice - riskPoints);
    takeProfit = roundToTick(entryPrice + targetPoints);
  } else {
    stopLoss = roundToTick(entryPrice + riskPoints);
    takeProfit = roundToTick(entryPrice - targetPoints);
  }

  // Generate random date and time
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
  const dateStr = date.toISOString().split('T')[0];

  const hours = 8 + Math.floor(Math.random() * 8); // 8am to 4pm
  const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return {
    symbol: symbolConfig.symbol,
    timeframe,
    exchange: symbolConfig.exchange,
    direction,
    entryPrice: roundToTick(entryPrice),
    stopLoss,
    takeProfit,
    riskReward: Math.round(riskReward * 100) / 100,
    date: dateStr,
    time: timeStr,
    outcome,
  };
}

// Generate screenshot from test case
async function generateScreenshot(browser: Browser, testCase: TestCase, outputPath: string): Promise<void> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 700 });

  // Load template
  const templatePath = path.join(__dirname, 'chart-template.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');

  // Inject config into HTML
  const configScript = `<script>window.CHART_CONFIG = ${JSON.stringify(testCase)};</script>`;
  const htmlWithConfig = templateHtml.replace('</head>', `${configScript}</head>`);

  await page.setContent(htmlWithConfig, { waitUntil: 'networkidle0' });

  // Wait for chart to render
  await page.evaluate(() => {
    // @ts-expect-error - generateChart is defined in the HTML
    if (typeof window.generateChart === 'function') {
      // @ts-expect-error - generateChart is defined in the HTML
      window.generateChart();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500)); // Let animations settle

  // Take screenshot
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
}

// Send screenshot to parse API
async function parseScreenshot(imagePath: string): Promise<ParsedResult | null> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  try {
    // Use the Anthropic API directly for testing (bypass auth)
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const today = new Date().toISOString().split('T')[0];

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      temperature: 0,
      system: `You are an expert OCR system specialized in reading TradingView chart position tools.

CRITICAL RULES:
1. Read numbers EXACTLY as displayed - never estimate or interpolate
2. NQ (Nasdaq futures) trades in the 20,000-22,000 range typically
3. ES (S&P futures) trades in the 4,000-6,000 range typically
4. The price scale on the RIGHT Y-AXIS tells you the correct magnitude
5. If you see prices like 21,400 on the axis, ALL position tool prices should be in that same range
6. Today's date is ${today} - use this if no date is visible on chart`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBuffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text: `Extract trade data from this TradingView chart's position tool overlay.

## CRITICAL: Price Scale Verification
FIRST, look at the RIGHT Y-AXIS price labels. Write down the range you see.
ALL prices you extract MUST be within this range.

## STEP 1: Identify Chart Info
- SYMBOL: Top-left corner (NQ, ES, NQH2026, ESH2026, MNQ, MES)
- TIMEFRAME: Usually shown near symbol (1m, 5m, 15m, 1H, 4H, D)
- DATE: Look for date on chart, or use today: ${today}

## STEP 2: Read Position Tool Prices
The position tool shows colored zones with price labels:
- RED zone = stop loss area
- BLUE zone = entry area
- GREEN zone = take profit area

Read the EXACT prices shown on the right price axis for each level.

## STEP 3: Read Risk:Reward Ratio
Look for text like "7.87R" or "2R" inside the position box.

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no explanation):
{
  "symbol": "NQH2026",
  "date": "${today}",
  "time": "10:30",
  "timeframe": "5m",
  "direction": "SHORT",
  "entryPrice": 21400.00,
  "stopLoss": 21429.75,
  "takeProfit": 21166.00,
  "riskReward": 7.87,
  "pointsRisked": 29.75,
  "pointsTarget": 234.00,
  "outcome": "OPEN",
  "confidence": 0.95
}`,
            },
          ],
        },
      ],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return null;
    }

    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

// Calculate accuracy for a test result
function calculateAccuracy(testCase: TestCase, parsed: ParsedResult | null): TestResult['accuracy'] {
  if (!parsed) {
    return {
      symbol: false,
      direction: false,
      entryPrice: { correct: false, diff: 999999, pctDiff: 100 },
      stopLoss: { correct: false, diff: 999999, pctDiff: 100 },
      takeProfit: { correct: false, diff: 999999, pctDiff: 100 },
      riskReward: { correct: false, diff: 100 },
      outcome: false,
    };
  }

  const priceThreshold = 0.005; // 0.5% tolerance
  const rrThreshold = 0.2; // 20% tolerance for R:R

  const entryDiff = Math.abs(parsed.entryPrice - testCase.entryPrice);
  const entryPctDiff = (entryDiff / testCase.entryPrice) * 100;

  const slDiff = Math.abs(parsed.stopLoss - testCase.stopLoss);
  const slPctDiff = (slDiff / testCase.stopLoss) * 100;

  const tpDiff = Math.abs(parsed.takeProfit - testCase.takeProfit);
  const tpPctDiff = (tpDiff / testCase.takeProfit) * 100;

  const rrDiff = Math.abs(parsed.riskReward - testCase.riskReward);

  return {
    symbol: parsed.symbol.includes(testCase.symbol.replace(/[0-9!]/g, '')),
    direction: parsed.direction === testCase.direction,
    entryPrice: {
      correct: entryPctDiff < priceThreshold * 100,
      diff: entryDiff,
      pctDiff: entryPctDiff,
    },
    stopLoss: {
      correct: slPctDiff < priceThreshold * 100,
      diff: slDiff,
      pctDiff: slPctDiff,
    },
    takeProfit: {
      correct: tpPctDiff < priceThreshold * 100,
      diff: tpDiff,
      pctDiff: tpPctDiff,
    },
    riskReward: {
      correct: rrDiff < testCase.riskReward * rrThreshold,
      diff: rrDiff,
    },
    outcome: parsed.outcome === testCase.outcome,
  };
}

// Calculate overall score
function calculateScore(accuracy: TestResult['accuracy']): number {
  const weights = {
    symbol: 5,
    direction: 15,
    entryPrice: 25,
    stopLoss: 20,
    takeProfit: 20,
    riskReward: 10,
    outcome: 5,
  };

  let score = 0;
  if (accuracy.symbol) score += weights.symbol;
  if (accuracy.direction) score += weights.direction;
  if (accuracy.entryPrice.correct) score += weights.entryPrice;
  if (accuracy.stopLoss.correct) score += weights.stopLoss;
  if (accuracy.takeProfit.correct) score += weights.takeProfit;
  if (accuracy.riskReward.correct) score += weights.riskReward;
  if (accuracy.outcome) score += weights.outcome;

  return score;
}

// Print test result
function printResult(result: TestResult, index: number): void {
  const { testCase, parsed, accuracy, overallScore } = result;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TEST #${index + 1} - ${testCase.symbol} ${testCase.direction}`);
  console.log(`${'═'.repeat(60)}`);

  console.log('\n📊 GROUND TRUTH:');
  console.log(`   Symbol:     ${testCase.symbol}`);
  console.log(`   Direction:  ${testCase.direction}`);
  console.log(`   Entry:      ${testCase.entryPrice.toFixed(2)}`);
  console.log(`   Stop Loss:  ${testCase.stopLoss.toFixed(2)}`);
  console.log(`   Take Profit:${testCase.takeProfit.toFixed(2)}`);
  console.log(`   R:R:        ${testCase.riskReward.toFixed(2)}`);
  console.log(`   Outcome:    ${testCase.outcome}`);

  if (parsed) {
    console.log('\n🤖 AI PARSED:');
    console.log(`   Symbol:     ${parsed.symbol} ${accuracy.symbol ? '✅' : '❌'}`);
    console.log(`   Direction:  ${parsed.direction} ${accuracy.direction ? '✅' : '❌'}`);
    console.log(`   Entry:      ${parsed.entryPrice?.toFixed(2)} ${accuracy.entryPrice.correct ? '✅' : `❌ (off by ${accuracy.entryPrice.diff.toFixed(2)}, ${accuracy.entryPrice.pctDiff.toFixed(3)}%)`}`);
    console.log(`   Stop Loss:  ${parsed.stopLoss?.toFixed(2)} ${accuracy.stopLoss.correct ? '✅' : `❌ (off by ${accuracy.stopLoss.diff.toFixed(2)}, ${accuracy.stopLoss.pctDiff.toFixed(3)}%)`}`);
    console.log(`   Take Profit:${parsed.takeProfit?.toFixed(2)} ${accuracy.takeProfit.correct ? '✅' : `❌ (off by ${accuracy.takeProfit.diff.toFixed(2)}, ${accuracy.takeProfit.pctDiff.toFixed(3)}%)`}`);
    console.log(`   R:R:        ${parsed.riskReward?.toFixed(2)} ${accuracy.riskReward.correct ? '✅' : `❌ (off by ${accuracy.riskReward.diff.toFixed(2)})`}`);
    console.log(`   Outcome:    ${parsed.outcome} ${accuracy.outcome ? '✅' : '❌'}`);
    console.log(`   Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
  } else {
    console.log('\n❌ AI PARSE FAILED');
  }

  console.log(`\n📈 SCORE: ${overallScore}/100`);
}

// Main test runner
async function runTests(numTests: number = 5): Promise<void> {
  console.log(`\n${'🧪'.repeat(30)}`);
  console.log('   AI CHART PARSER ACCURACY TEST');
  console.log(`${'🧪'.repeat(30)}\n`);

  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'test-outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Launch browser
  const browser = await puppeteer.launch({ headless: true });
  const results: TestResult[] = [];

  try {
    for (let i = 0; i < numTests; i++) {
      console.log(`\nGenerating test ${i + 1}/${numTests}...`);

      // Generate test case
      const testCase = generateTestCase();
      const screenshotPath = path.join(outputDir, `test-${i + 1}.png`);

      // Generate screenshot
      await generateScreenshot(browser, testCase, screenshotPath);
      console.log(`Screenshot saved: ${screenshotPath}`);

      // Parse with AI
      console.log('Sending to AI for parsing...');
      const parsed = await parseScreenshot(screenshotPath);

      // Calculate accuracy
      const accuracy = calculateAccuracy(testCase, parsed);
      const overallScore = calculateScore(accuracy);

      const result: TestResult = {
        testCase,
        parsed,
        errors: parsed ? [] : ['Parse failed'],
        accuracy,
        overallScore,
      };

      results.push(result);
      printResult(result, i);

      // Save test case for reference
      fs.writeFileSync(
        path.join(outputDir, `test-${i + 1}-ground-truth.json`),
        JSON.stringify(testCase, null, 2)
      );

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log(`\n${'═'.repeat(60)}`);
    console.log('📊 SUMMARY');
    console.log(`${'═'.repeat(60)}`);

    const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
    const symbolAcc = results.filter(r => r.accuracy.symbol).length / results.length * 100;
    const directionAcc = results.filter(r => r.accuracy.direction).length / results.length * 100;
    const entryAcc = results.filter(r => r.accuracy.entryPrice.correct).length / results.length * 100;
    const slAcc = results.filter(r => r.accuracy.stopLoss.correct).length / results.length * 100;
    const tpAcc = results.filter(r => r.accuracy.takeProfit.correct).length / results.length * 100;
    const rrAcc = results.filter(r => r.accuracy.riskReward.correct).length / results.length * 100;

    console.log(`\nTests Run:       ${results.length}`);
    console.log(`Average Score:   ${avgScore.toFixed(1)}/100`);
    console.log(`\nAccuracy by Field:`);
    console.log(`  Symbol:        ${symbolAcc.toFixed(1)}%`);
    console.log(`  Direction:     ${directionAcc.toFixed(1)}%`);
    console.log(`  Entry Price:   ${entryAcc.toFixed(1)}%`);
    console.log(`  Stop Loss:     ${slAcc.toFixed(1)}%`);
    console.log(`  Take Profit:   ${tpAcc.toFixed(1)}%`);
    console.log(`  Risk:Reward:   ${rrAcc.toFixed(1)}%`);

    // Save summary
    fs.writeFileSync(
      path.join(outputDir, 'summary.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        testsRun: results.length,
        averageScore: avgScore,
        accuracy: {
          symbol: symbolAcc,
          direction: directionAcc,
          entryPrice: entryAcc,
          stopLoss: slAcc,
          takeProfit: tpAcc,
          riskReward: rrAcc,
        },
        results,
      }, null, 2)
    );

    console.log(`\nResults saved to: ${outputDir}`);

  } finally {
    await browser.close();
  }
}

// Run with command line args
const numTests = parseInt(process.argv[2]) || 5;
runTests(numTests).catch(console.error);
