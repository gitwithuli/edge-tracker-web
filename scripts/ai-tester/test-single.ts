import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../../.env.local') });

// Load ground truth from generated sample
const groundTruth = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'test-outputs', 'realistic-sample-truth.json'), 'utf-8')
);

async function testSingle() {
  console.log('═'.repeat(60));
  console.log('🧪 AI CHART PARSER - SINGLE TEST');
  console.log('═'.repeat(60));

  const imagePath = path.join(__dirname, 'test-outputs', 'realistic-sample.png');
  const imageBuffer = fs.readFileSync(imagePath);

  console.log('\n📊 GROUND TRUTH:');
  console.log(`   Symbol:      ${groundTruth.symbol}`);
  console.log(`   Direction:   ${groundTruth.direction}`);
  console.log(`   Entry:       ${groundTruth.entryPrice.toFixed(2)}`);
  console.log(`   Stop Loss:   ${groundTruth.stopLoss.toFixed(2)}`);
  console.log(`   Take Profit: ${groundTruth.takeProfit.toFixed(2)}`);
  console.log(`   R:R:         ${groundTruth.riskReward.toFixed(2)}`);

  console.log('\n🤖 Sending to Opus 4.5...');

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
The position tool shows colored zones with price labels on the RIGHT Y-AXIS:
- ORANGE label = stop loss price
- BLUE label = entry price
- GREEN label = take profit price
- RED label = current price (ignore this)

Read the EXACT prices from the colored labels on the right price axis.

## STEP 3: Read Risk:Reward Ratio
Look for text like "7.27R" inside the position box.

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
    console.log('❌ No response from AI');
    return;
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim());

  console.log('\n🤖 AI PARSED:');
  const symbolMatch = parsed.symbol?.includes(groundTruth.symbol.substring(0, 2));
  const checkSymbol = symbolMatch ? '✅' : '❌';
  const checkDir = parsed.direction === groundTruth.direction ? '✅' : '❌';

  const entryDiff = Math.abs(parsed.entryPrice - groundTruth.entryPrice);
  const checkEntry = entryDiff < 1 ? '✅' : `❌ (off by ${entryDiff.toFixed(2)})`;

  const slDiff = Math.abs(parsed.stopLoss - groundTruth.stopLoss);
  const checkSL = slDiff < 1 ? '✅' : `❌ (off by ${slDiff.toFixed(2)})`;

  const tpDiff = Math.abs(parsed.takeProfit - groundTruth.takeProfit);
  const checkTP = tpDiff < 1 ? '✅' : `❌ (off by ${tpDiff.toFixed(2)})`;

  const rrDiff = Math.abs(parsed.riskReward - groundTruth.riskReward);
  const checkRR = rrDiff < 0.5 ? '✅' : `❌ (off by ${rrDiff.toFixed(2)})`;

  console.log(`   Symbol:      ${parsed.symbol} ${checkSymbol}`);
  console.log(`   Direction:   ${parsed.direction} ${checkDir}`);
  console.log(`   Entry:       ${parsed.entryPrice?.toFixed(2)} ${checkEntry}`);
  console.log(`   Stop Loss:   ${parsed.stopLoss?.toFixed(2)} ${checkSL}`);
  console.log(`   Take Profit: ${parsed.takeProfit?.toFixed(2)} ${checkTP}`);
  console.log(`   R:R:         ${parsed.riskReward?.toFixed(2)} ${checkRR}`);
  console.log(`   Confidence:  ${(parsed.confidence * 100).toFixed(0)}%`);

  // Calculate score
  let score = 0;
  if (symbolMatch) score += 10;
  if (parsed.direction === groundTruth.direction) score += 15;
  if (entryDiff < 1) score += 25;
  if (slDiff < 1) score += 20;
  if (tpDiff < 1) score += 20;
  if (rrDiff < 0.5) score += 10;

  console.log('\n' + '═'.repeat(60));
  console.log(`📈 SCORE: ${score}/100`);
  console.log('═'.repeat(60));
}

testSingle().catch(console.error);
