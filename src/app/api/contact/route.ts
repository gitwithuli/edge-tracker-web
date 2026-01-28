import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

// Simple in-memory rate limiter: max 3 submissions per IP per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 }
      );
    }

    const body: ContactRequest = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const { error } = await getSupabaseAdmin()
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
      });

    if (error) {
      console.error("Failed to save contact message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
