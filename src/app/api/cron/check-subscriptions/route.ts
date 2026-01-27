import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Timing-safe comparison to prevent timing attacks
    const expected = Buffer.from(`Bearer ${cronSecret}`);
    const received = Buffer.from(authHeader || '');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    // 1. Downgrade expired trials to free
    const { data: expiredTrials, error: trialError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ subscription_tier: 'free' })
      .eq('subscription_tier', 'trial')
      .lt('trial_ends_at', now)
      .select('user_id');

    if (trialError) {
      console.error('[Cron] Trial downgrade error:', trialError.message);
    }

    // 2. Downgrade expired crypto payments (past current_period_end)
    const { data: expiredCrypto, error: cryptoError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ subscription_tier: 'unpaid', payment_status: 'expired' })
      .eq('subscription_tier', 'paid')
      .eq('payment_provider', 'nowpayments')
      .lt('current_period_end', now)
      .select('user_id');

    if (cryptoError) {
      console.error('[Cron] Crypto downgrade error:', cryptoError.message);
    }

    const result = {
      expiredTrials: expiredTrials?.length || 0,
      expiredCrypto: expiredCrypto?.length || 0,
      checkedAt: now,
    };

    console.log('[Cron] Subscription check complete:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] Check subscriptions error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
