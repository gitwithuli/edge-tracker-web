import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edgeofict.com';
const PRICE_AMOUNT = 14.50;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // 1. Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check if already paid
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.subscription_tier === 'paid') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    // 3. Create NOWPayments invoice
    const invoiceResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: PRICE_AMOUNT,
        price_currency: 'usd',
        order_id: `edgetracker_${user.id}`,
        order_description: 'Edge Tracker Pro - Monthly',
        ipn_callback_url: `${APP_URL}/api/webhooks/nowpayments`,
        success_url: `${APP_URL}/dashboard?upgraded=true`,
        cancel_url: `${APP_URL}/pricing`,
      }),
    });

    if (!invoiceResponse.ok) {
      const errorData = await invoiceResponse.text();
      console.error('[Crypto Checkout] NOWPayments API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create payment invoice' },
        { status: 500 }
      );
    }

    const invoice = await invoiceResponse.json();

    // 4. Store payment reference in subscription record
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        payment_provider: 'nowpayments',
        payment_id: invoice.id?.toString() || null,
        payment_status: 'waiting',
      })
      .eq('user_id', user.id);

    // 5. Return invoice URL for frontend redirect
    return NextResponse.json({ url: invoice.invoice_url });
  } catch (err) {
    console.error('[Crypto Checkout] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
