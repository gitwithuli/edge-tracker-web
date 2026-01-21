import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { convertTvUrlToImageUrl, fetchTvImageAsBase64, validateBase64Image } from "@/lib/tradingview";
import type { ParsedChartData, ChartParseResponse } from "@/lib/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MONTHLY_LIMIT = 100;

interface ParseChartRequest {
  imageUrl?: string;
  imageBase64?: string;
  edgeId?: string;
}

// Simple, natural prompt that works well with Gemini's vision
const CHART_ANALYSIS_PROMPT = `Look at this TradingView chart screenshot. There is a position tool drawn on it with text labels showing the exact prices.

READ THE EXACT NUMBERS from the position tool labels:
- The entry price (middle horizontal line)
- The stop loss price (red area boundary)
- The take profit price (green area boundary)
- The R:R ratio shown on the tool (like "2.5R" or "1:2.5")

Also identify:
- Symbol (shown in top left, like "NQ", "ES", "EURUSD")
- Timeframe (like "5m", "15m", "1h")
- Date and time from the chart
- Direction (LONG if green is above entry, SHORT if green is below)
- Outcome: Look at candles AFTER entry - did price reach green zone (WIN), red zone (LOSS), or neither (OPEN)?

IMPORTANT: Read the EXACT prices shown as text labels on the position tool. Do NOT estimate from chart lines.

Return ONLY this JSON:
{"symbol":"","timeframe":"","date":"YYYY-MM-DD","time":"HH:MM","direction":"LONG or SHORT","entry":0,"stopLoss":0,"takeProfit":0,"riskReward":0,"outcome":"WIN or LOSS or OPEN"}`;

// Mock parsed data for development/testing
function getMockParsedData(): ParsedChartData {
  const directions = ['LONG', 'SHORT'] as const;
  const outcomes = ['WIN', 'LOSS', 'OPEN'] as const;

  const direction = directions[Math.floor(Math.random() * directions.length)];
  const entryPrice = 4150 + Math.random() * 100;
  const pointsRisked = 5 + Math.random() * 10;
  const riskReward = 1.5 + Math.random() * 2;
  const pointsTarget = pointsRisked * riskReward;

  return {
    symbol: "ES",
    date: new Date().toISOString().split('T')[0],
    time: "10:30",
    timeframe: "5m",
    direction,
    entryPrice: Math.round(entryPrice * 100) / 100,
    stopLoss: direction === 'LONG'
      ? Math.round((entryPrice - pointsRisked) * 100) / 100
      : Math.round((entryPrice + pointsRisked) * 100) / 100,
    takeProfit: direction === 'LONG'
      ? Math.round((entryPrice + pointsTarget) * 100) / 100
      : Math.round((entryPrice - pointsTarget) * 100) / 100,
    riskReward: Math.round(riskReward * 100) / 100,
    pointsRisked: Math.round(pointsRisked * 100) / 100,
    pointsTarget: Math.round(pointsTarget * 100) / 100,
    outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
    confidence: 0.85 + Math.random() * 0.1,
  };
}

// Get current month in YYYY-MM format
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Validate and auto-correct parsed data
function validateAndCorrectParsedData(data: ParsedChartData): ParsedChartData {
  const corrected = { ...data };
  const corrections: string[] = [];

  // Ensure numeric fields are numbers
  corrected.entryPrice = Number(corrected.entryPrice) || 0;
  corrected.stopLoss = Number(corrected.stopLoss) || 0;
  corrected.takeProfit = Number(corrected.takeProfit) || 0;
  corrected.riskReward = Number(corrected.riskReward) || 0;

  // Detect direction from price relationships if not set or inconsistent
  const detectedDirection = corrected.stopLoss > corrected.entryPrice ? 'SHORT' : 'LONG';
  if (!corrected.direction || !['LONG', 'SHORT'].includes(corrected.direction)) {
    corrections.push(`Direction corrected: ${corrected.direction} -> ${detectedDirection}`);
    corrected.direction = detectedDirection;
  }

  // Fix swapped stop/target based on direction
  if (corrected.direction === 'SHORT') {
    if (corrected.stopLoss < corrected.takeProfit) {
      corrections.push(`SHORT: Swapped SL(${corrected.stopLoss}) <-> TP(${corrected.takeProfit})`);
      const temp = corrected.stopLoss;
      corrected.stopLoss = corrected.takeProfit;
      corrected.takeProfit = temp;
    }
  } else {
    if (corrected.stopLoss > corrected.takeProfit) {
      corrections.push(`LONG: Swapped SL(${corrected.stopLoss}) <-> TP(${corrected.takeProfit})`);
      const temp = corrected.stopLoss;
      corrected.stopLoss = corrected.takeProfit;
      corrected.takeProfit = temp;
    }
  }

  // Recalculate pointsRisked and pointsTarget
  corrected.pointsRisked = Math.abs(corrected.entryPrice - corrected.stopLoss);
  corrected.pointsTarget = Math.abs(corrected.entryPrice - corrected.takeProfit);

  // Round to 2 decimal places
  corrected.pointsRisked = Math.round(corrected.pointsRisked * 100) / 100;
  corrected.pointsTarget = Math.round(corrected.pointsTarget * 100) / 100;

  // Recalculate R:R if it seems wrong (more than 20% off from calculated)
  if (corrected.pointsRisked > 0) {
    const calculatedRR = corrected.pointsTarget / corrected.pointsRisked;
    const diff = Math.abs(calculatedRR - corrected.riskReward);
    if (diff > calculatedRR * 0.2 || corrected.riskReward <= 0) {
      corrections.push(`R:R recalculated: ${corrected.riskReward} -> ${Math.round(calculatedRR * 100) / 100} (calculated from points)`);
      corrected.riskReward = Math.round(calculatedRR * 100) / 100;
    }
  }

  if (corrections.length > 0) {
    console.log("=== VALIDATION CORRECTIONS ===", corrections);
  }

  // Validate outcome
  if (!corrected.outcome || !['WIN', 'LOSS', 'OPEN'].includes(corrected.outcome)) {
    corrected.outcome = 'OPEN';
  }

  // Ensure confidence is between 0 and 1
  if (typeof corrected.confidence !== 'number' || corrected.confidence < 0 || corrected.confidence > 1) {
    corrected.confidence = 0.85;
  }

  // Validate date format (YYYY-MM-DD)
  if (!corrected.date || !/^\d{4}-\d{2}-\d{2}$/.test(corrected.date)) {
    corrected.date = new Date().toISOString().split('T')[0];
  }

  // Validate time format (HH:MM)
  if (!corrected.time || !/^\d{2}:\d{2}$/.test(corrected.time)) {
    corrected.time = "00:00";
  }

  return corrected;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription tier
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("subscription_tier")
      .eq("user_id", user.id)
      .single();

    const tier = subscription?.subscription_tier || "retail";

    if (tier !== "inner_circle") {
      return NextResponse.json(
        { error: "AI Chart Parser requires Inner Circle subscription" },
        { status: 403 }
      );
    }

    // Check usage limits
    const currentMonth = getCurrentMonth();
    const { data: usageData } = await supabase
      .from("ai_usage")
      .select("parse_count")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single();

    const currentUsage = usageData?.parse_count || 0;

    if (currentUsage >= MONTHLY_LIMIT) {
      return NextResponse.json({
        success: false,
        error: "Monthly usage limit reached",
        usage: {
          used: currentUsage,
          limit: MONTHLY_LIMIT,
          remaining: 0,
        },
      } as ChartParseResponse, { status: 429 });
    }

    // Parse request body
    const body: ParseChartRequest = await request.json();
    const { imageUrl, imageBase64 } = body;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "Either imageUrl or imageBase64 is required" },
        { status: 400 }
      );
    }

    // Get image as base64
    let base64Image = imageBase64;

    if (imageUrl) {
      // Check if it's a TradingView URL
      const directUrl = convertTvUrlToImageUrl(imageUrl);
      if (directUrl) {
        const fetched = await fetchTvImageAsBase64(imageUrl);
        if (!fetched) {
          return NextResponse.json(
            { error: "Failed to fetch TradingView image" },
            { status: 400 }
          );
        }
        base64Image = fetched;
      } else {
        // Try to fetch as regular URL
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            return NextResponse.json(
              { error: "Failed to fetch image from URL" },
              { status: 400 }
            );
          }
          const arrayBuffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'image/png';
          base64Image = `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
        } catch {
          return NextResponse.json(
            { error: "Invalid image URL" },
            { status: 400 }
          );
        }
      }
    }

    // Validate base64 image
    if (base64Image && !validateBase64Image(base64Image)) {
      return NextResponse.json(
        { error: "Invalid image format. Supported: PNG, JPEG, WEBP" },
        { status: 400 }
      );
    }

    // Check file size (rough estimate from base64)
    if (base64Image) {
      const sizeInBytes = (base64Image.length * 3) / 4;
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (sizeInBytes > maxSize) {
        return NextResponse.json(
          { error: "Image too large. Maximum size is 10MB" },
          { status: 400 }
        );
      }
    }

    let parsedData: ParsedChartData;
    let isMock = false;

    // Use Google Gemini for chart parsing (better visual understanding)
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log("[MOCK] Google AI API not configured, returning mock parsed data");
      parsedData = getMockParsedData();
      isMock = true;
    } else {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const base64Data = base64Image!.split(',')[1];
      const mimeType = base64Image!.split(';')[0].split(':')[1];

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        CHART_ANALYSIS_PROMPT,
      ]);

      const response = result.response;
      const text = response.text();

      if (!text) {
        return NextResponse.json(
          { error: "Failed to get response from AI" },
          { status: 500 }
        );
      }

      try {
        // Log raw Gemini response for debugging
        console.log("=== GEMINI RAW RESPONSE ===");
        console.log(text);
        console.log("=== END RESPONSE ===");

        // Extract JSON from the response - find the last JSON object with "symbol"
        const jsonMatch = text.match(/\{[^{}]*"symbol"[^{}]*\}/g);
        if (!jsonMatch || jsonMatch.length === 0) {
          console.error("No JSON found in Gemini response:", text);
          return NextResponse.json(
            { error: "Failed to parse AI response" },
            { status: 500 }
          );
        }

        // Use the last match (the final JSON output)
        const rawData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
        console.log("=== PARSED JSON ===", rawData);

        // Map Gemini response to our ParsedChartData format
        const today = new Date().toISOString().split('T')[0];

        // Parse outcome from Gemini response
        let outcome: "WIN" | "LOSS" | "OPEN" = "OPEN";
        const rawOutcome = rawData.outcome?.toUpperCase();
        if (rawOutcome === "WIN") outcome = "WIN";
        else if (rawOutcome === "LOSS") outcome = "LOSS";

        parsedData = {
          symbol: rawData.symbol || "UNKNOWN",
          date: rawData.date || today,
          time: rawData.time || "00:00",
          timeframe: rawData.timeframe || "5m",
          direction: rawData.direction?.toUpperCase() === "SHORT" ? "SHORT" : "LONG",
          entryPrice: Number(rawData.entry) || 0,
          stopLoss: Number(rawData.stopLoss) || 0,
          takeProfit: Number(rawData.takeProfit) || 0,
          riskReward: Number(rawData.riskReward) || 0,
          pointsRisked: 0,
          pointsTarget: 0,
          outcome,
          confidence: 0.9,
        };

        console.log("=== BEFORE VALIDATION ===", {
          entry: parsedData.entryPrice,
          sl: parsedData.stopLoss,
          tp: parsedData.takeProfit,
          rr: parsedData.riskReward,
          direction: parsedData.direction,
        });

        parsedData = validateAndCorrectParsedData(parsedData);

        console.log("=== AFTER VALIDATION ===", {
          entry: parsedData.entryPrice,
          sl: parsedData.stopLoss,
          tp: parsedData.takeProfit,
          rr: parsedData.riskReward,
          direction: parsedData.direction,
        });
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", text, parseError);
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
    }

    // Increment usage count
    const { error: usageError } = await supabase
      .from("ai_usage")
      .upsert({
        user_id: user.id,
        month: currentMonth,
        parse_count: currentUsage + 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,month",
      });

    if (usageError) {
      console.error("Failed to update usage:", usageError);
    }

    // Save parsed chart to database
    const { error: saveError } = await supabase
      .from("parsed_charts")
      .insert({
        user_id: user.id,
        edge_id: body.edgeId || null,
        symbol: parsedData.symbol,
        parsed_date: parsedData.date,
        parsed_time: parsedData.time,
        timeframe: parsedData.timeframe,
        direction: parsedData.direction,
        entry_price: parsedData.entryPrice,
        stop_loss: parsedData.stopLoss,
        take_profit: parsedData.takeProfit,
        risk_reward: parsedData.riskReward,
        outcome: parsedData.outcome,
        confidence: parsedData.confidence,
        raw_response: isMock ? { mock: true } : parsedData,
      });

    if (saveError) {
      console.error("Failed to save parsed chart:", saveError);
    }

    return NextResponse.json({
      success: true,
      mock: isMock,
      data: parsedData,
      usage: {
        used: currentUsage + 1,
        limit: MONTHLY_LIMIT,
        remaining: MONTHLY_LIMIT - (currentUsage + 1),
      },
    } as ChartParseResponse);
  } catch (error) {
    console.error("Parse chart error:", error);
    return NextResponse.json(
      { error: "Failed to parse chart" },
      { status: 500 }
    );
  }
}
