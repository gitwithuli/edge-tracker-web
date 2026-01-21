import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { SubscriptionTier } from "@/lib/types";

// Create Supabase client inside handler to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getTierFromPriceId(priceId: string): SubscriptionTier {
  if (priceId.includes("inner_circle")) return "inner_circle";
  if (priceId.includes("trader")) return "trader";
  return "retail";
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const supabase = getSupabaseAdmin();

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.log("[MOCK] Stripe webhook not configured, processing mock event");

      // Parse as mock event
      const mockEvent = JSON.parse(body);

      if (mockEvent.type === "mock.subscription.upgraded") {
        const { userId, tier } = mockEvent.data;

        const { error } = await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            subscription_tier: tier,
            subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (error) {
          console.error("Mock webhook error:", error);
          return NextResponse.json({ error: "Failed to process mock event" }, { status: 500 });
        }

        return NextResponse.json({ received: true, mock: true });
      }

      return NextResponse.json({ received: true, mock: true, message: "Mock mode - no action taken" });
    }

    // Real Stripe webhook processing
    const Stripe = await import("stripe").then((m) => m.default);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier as SubscriptionTier;

        if (!userId || !tier) {
          console.error("Missing metadata in checkout session");
          break;
        }

        const { error } = await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            subscription_tier: tier,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_ends_at: null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

        if (error) {
          console.error("Error updating subscription after checkout:", error);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: existingSub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!existingSub) {
          console.error("No subscription found for customer:", customerId);
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id || "";
        const tier = getTierFromPriceId(priceId);
        const subscriptionData = subscription as unknown as { current_period_end?: number };
        const endsAt = subscriptionData.current_period_end
          ? new Date(subscriptionData.current_period_end * 1000).toISOString()
          : null;

        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            subscription_tier: tier,
            subscription_ends_at: endsAt,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", existingSub.user_id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: existingSub } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!existingSub) {
          console.error("No subscription found for customer:", customerId);
          break;
        }

        // Downgrade to retail
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            subscription_tier: "retail",
            subscription_ends_at: null,
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", existingSub.user_id);

        if (error) {
          console.error("Error downgrading subscription:", error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("Payment failed for invoice:", invoice.id, "customer:", invoice.customer);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
