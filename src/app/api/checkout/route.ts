import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { SubscriptionTier } from "@/lib/types";
import type Stripe from "stripe";

interface CheckoutRequest {
  tier: SubscriptionTier;
  yearly?: boolean;
}

const TIER_CONFIG: Record<"trader" | "inner_circle", {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
}> = {
  trader: {
    name: "Trader",
    monthlyPrice: 900, // $9.00 in cents
    yearlyPrice: 9000, // $90.00 in cents (save ~17%)
  },
  inner_circle: {
    name: "Inner Circle",
    monthlyPrice: 2900, // $29.00 in cents
    yearlyPrice: 29000, // $290.00 in cents (save ~17%)
  },
};

// Get or create a price for a tier
async function getOrCreatePrice(
  stripe: Stripe,
  tier: "trader" | "inner_circle",
  yearly: boolean
): Promise<string> {
  const config = TIER_CONFIG[tier];
  const interval = yearly ? "year" : "month";
  const amount = yearly ? config.yearlyPrice : config.monthlyPrice;
  const lookupKey = `edge_tracker_${tier}_${interval}`;

  // Try to find existing price by lookup key
  const existingPrices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  if (existingPrices.data.length > 0) {
    return existingPrices.data[0].id;
  }

  // Find or create product
  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });

  let product = products.data.find(p => p.metadata?.tier === tier);

  if (!product) {
    product = await stripe.products.create({
      name: `Edge Tracker - ${config.name}`,
      metadata: { tier },
    });
  }

  // Create price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: "usd",
    recurring: { interval },
    lookup_key: lookupKey,
  });

  return price.id;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CheckoutRequest = await request.json();
    const { tier, yearly = false } = body;

    if (!tier || tier === "retail") {
      return NextResponse.json(
        { error: "Invalid tier. Cannot checkout for retail tier." },
        { status: 400 }
      );
    }

    if (!["trader", "inner_circle"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'trader' or 'inner_circle'." },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log("[MOCK] Stripe not configured, returning mock checkout URL");

      // Mock: Simulate successful checkout by updating subscription directly
      // Include 7-day trial period
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const { error: upsertError } = await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          subscription_tier: tier,
          subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          trial_ends_at: trialEndDate.toISOString(),
          stripe_customer_id: `mock_cus_${user.id.slice(0, 8)}`,
          stripe_subscription_id: `mock_sub_${Date.now()}`,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (upsertError) {
        console.error("Error updating subscription:", upsertError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        mock: true,
        message: `Mock checkout complete. You are now on the ${tier} tier with a 7-day free trial.`,
        redirectUrl: "/dashboard?upgraded=true",
      });
    }

    // Real Stripe implementation (when key is available)
    const Stripe = await import("stripe").then((m) => m.default);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    // Get or create Stripe customer
    let customerId: string;

    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          subscription_tier: "retail",
        }, {
          onConflict: "user_id",
        });
    }

    // Get or create price dynamically
    const priceId = await getOrCreatePrice(stripe, tier as "trader" | "inner_circle", yearly);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
      subscription_data: {
        trial_period_days: 7, // 1 week free trial
      },
      metadata: {
        userId: user.id,
        tier,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
