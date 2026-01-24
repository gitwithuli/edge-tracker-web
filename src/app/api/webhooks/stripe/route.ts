import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Stripe initialization is conditional - will be replaced with LemonSqueezy
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    })
  : null;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Stripe not configured (switching to LemonSqueezy)
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.error('No user ID in checkout session metadata');
          break;
        }

        // Update subscription status
        await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            subscription_tier: 'paid',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          }, {
            onConflict: 'user_id',
          });

        console.log(`User ${userId} upgraded to paid`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          // Try to find user by customer ID
          const { data: sub } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single();

          if (!sub) {
            console.error('No user found for subscription:', subscription.id);
            break;
          }
        }

        const targetUserId = userId || (await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single()
          .then(r => r.data?.user_id));

        if (!targetUserId) break;

        const isActive = subscription.status === 'active' || subscription.status === 'trialing';

        // Access period info (cast to unknown first for type safety)
        const subData = subscription as unknown as Record<string, unknown>;
        const periodStart = subData.current_period_start as number | undefined;
        const periodEnd = subData.current_period_end as number | undefined;

        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            subscription_tier: isActive ? 'paid' : 'unpaid',
            current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('user_id', targetUserId);

        console.log(`Subscription updated for user ${targetUserId}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by stripe subscription ID
        const { data: sub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (!sub) {
          console.error('No user found for deleted subscription:', subscription.id);
          break;
        }

        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            subscription_tier: 'unpaid',
            stripe_subscription_id: null,
            cancel_at_period_end: false,
          })
          .eq('user_id', sub.user_id);

        console.log(`Subscription deleted for user ${sub.user_id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (sub) {
          console.log(`Payment failed for user ${sub.user_id}`);
          // Optionally send notification or update status
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
