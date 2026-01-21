import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body: ContactRequest = await request.json();

    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      message,
      created_at: new Date().toISOString(),
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
