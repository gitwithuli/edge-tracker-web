import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../../.env.local') });

async function testReal() {
  console.log('═'.repeat(60));
  console.log('🧪 AI CHART PARSER - REAL TRADINGVIEW TEST');
  console.log('═'.repeat(60));

  const imagePath = path.join(__dirname, 'test-outputs', 'real-chart.png');
  const imageBuffer = fs.readFileSync(imagePath);

  console.log('\n🤖 Sending real TradingView chart to Opus 4.5...');

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const today = new Date().toISOString().split('T')[0];

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 4096,
    temperature: 0,
    system: `You are an expert at reading TradingView charts with position tool overlays.

CRITICAL: Read the EXACT numbers from the price axis labels on the RIGHT side of the chart.
The position tool shows colored price labels that indicate:
- Stop loss price
- Entry price
- Take profit price

Also look for the R:R ratio displayed inside the position box.`,
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
            text: `Extract the trade data from this TradingView position tool.

Look at the RIGHT Y-AXIS for colored price labels.
Look inside the position box for the R:R ratio.

Determine direction by looking at which zone is above/below entry:
- If stop is ABOVE entry = SHORT
- If stop is BELOW entry = LONG

Return ONLY valid JSON:
{
  "symbol": "string",
  "direction": "LONG or SHORT",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "riskReward": number,
  "confidence": number
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
  console.log('\n📝 Raw response:');
  console.log(jsonStr);

  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonStr.trim());

  console.log('\n' + '═'.repeat(60));
  console.log('🤖 AI PARSED RESULTS:');
  console.log('═'.repeat(60));
  console.log(`   Symbol:      ${parsed.symbol}`);
  console.log(`   Direction:   ${parsed.direction}`);
  console.log(`   Entry:       ${parsed.entryPrice?.toFixed(2)}`);
  console.log(`   Stop Loss:   ${parsed.stopLoss?.toFixed(2)}`);
  console.log(`   Take Profit: ${parsed.takeProfit?.toFixed(2)}`);
  console.log(`   R:R:         ${parsed.riskReward?.toFixed(2)}`);
  console.log(`   Confidence:  ${(parsed.confidence * 100).toFixed(0)}%`);
  console.log('═'.repeat(60));
}

testReal().catch(console.error);
