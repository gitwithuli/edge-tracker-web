import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Early adopter promo price
const PROMO_PRICE_ID = process.env.STRIPE_PROMO_PRICE_ID!;
const REGULAR_PRICE_ID = process.env.STRIPE_PRICE_ID!;
const MAX_PROMO_CUSTOMERS = 20;

async function getPromoCustomerCount(): Promise<number> {
  const { count } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_tier', 'paid');

  return count || 0;
}

export async function POST() {
  try {
    // Get user from cookies
    const cookieStore = await cookies();
    const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
    const supabaseRefreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!supabaseAccessToken) {
      // Try to get user from auth cookies (newer format)
      const authCookies = cookieStore.getAll().filter(c => c.name.includes('auth-token'));
      if (authCookies.length === 0) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Create a supabase client with user context
    const { createServerClient } = await import('@supabase/ssr');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has an active subscription
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.subscription_tier === 'paid') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    // Check if promo is still available
    const promoCustomerCount = await getPromoCustomerCount();
    const usePromoPrice = promoCustomerCount < MAX_PROMO_CUSTOMERS;
    const priceId = usePromoPrice ? PROMO_PRICE_ID : REGULAR_PRICE_ID;

    // Get or create Stripe customer
    let stripeCustomerId = existingSub?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update subscription record with customer ID
      if (existingSub) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('user_id', user.id);
      } else {
        await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            subscription_tier: 'unpaid',
            stripe_customer_id: stripeCustomerId,
          });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
