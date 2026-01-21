import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../../.env.local') });

async function testSimple() {
  console.log('═'.repeat(60));
  console.log('🧪 SIMPLE PROMPT TEST');
  console.log('═'.repeat(60));

  const imagePath = path.join(__dirname, 'test-outputs', 'real-chart.png');
  const imageBuffer = fs.readFileSync(imagePath);

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Super simple prompt - trust the model's vision
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5-20251101',
    max_tokens: 1024,
    temperature: 0,
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
            text: `This is a TradingView chart with a position tool overlay.

Read the exact entry, stop loss, and take profit prices from the price axis labels.

JSON only:
{"symbol":"","direction":"LONG or SHORT","entry":0,"stop":0,"target":0,"rr":0}`,
          },
        ],
      },
    ],
  });

  const textContent = message.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    console.log('❌ No response');
    return;
  }

  console.log('\n📝 Response:');
  console.log(textContent.text);
}

testSimple().catch(console.error);
