import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { WaitlistWelcomeEmail } from "@/lib/emails/waitlist-welcome";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "You're already on the list", alreadyExists: true },
        { status: 200 }
      );
    }

    // Insert new email
    const { error } = await supabase.from("waitlist").insert({
      email: normalizedEmail,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Waitlist insert error:", error);
      return NextResponse.json(
        { error: "Failed to join waitlist" },
        { status: 500 }
      );
    }

    // Send welcome email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Edge of ICT <hello@edgeofict.com>",
        to: normalizedEmail,
        subject: "You're on the waitlist",
        react: WaitlistWelcomeEmail({ email: normalizedEmail }),
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Welcome email failed:", emailError);
    }

    return NextResponse.json(
      { message: "Successfully joined the waitlist" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
