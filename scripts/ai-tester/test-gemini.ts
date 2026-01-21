import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '../../.env.local') });

const PROMPT = `Look at this TradingView chart and tell me:

1. What symbol and timeframe is this?
2. What is the date and time shown?
3. Can you see the position tool overlay?
4. Is this a LONG or SHORT setup?
5. What are the exact entry, stop loss, and take profit prices?
6. What is the R/R ratio shown?

After your analysis, provide the data in this exact JSON format:
{"symbol":"","timeframe":"","date":"YYYY-MM-DD","time":"HH:MM","direction":"LONG or SHORT","entry":0,"stopLoss":0,"takeProfit":0,"riskReward":0}`;

async function testGemini() {
  console.log('═'.repeat(60));
  console.log('🧪 GEMINI CHART PARSER TEST');
  console.log('═'.repeat(60));

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('❌ GOOGLE_AI_API_KEY not set in .env.local');
    console.log('   Add: GOOGLE_AI_API_KEY=your_api_key');
    return;
  }

  const imagePath = path.join(__dirname, 'test-outputs', 'real-chart.png');
  if (!fs.existsSync(imagePath)) {
    console.log('❌ No test image found at:', imagePath);
    return;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Data = imageBuffer.toString('base64');

  console.log('\n🤖 Sending to Gemini 2.0 Flash...\n');

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/png',
        data: base64Data,
      },
    },
    PROMPT,
  ]);

  const response = result.response;
  const text = response.text();

  console.log('📝 Gemini Response:');
  console.log('─'.repeat(60));
  console.log(text);
  console.log('─'.repeat(60));

  // Extract JSON
  const jsonMatch = text.match(/\{[^{}]*"symbol"[^{}]*\}/);
  if (jsonMatch) {
    console.log('\n✅ Extracted JSON:');
    const parsed = JSON.parse(jsonMatch[0]);
    console.log(JSON.stringify(parsed, null, 2));
  }
}

testGemini().catch(console.error);
