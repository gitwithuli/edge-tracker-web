import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((result: Record<string, unknown>, key) => {
      result[key] = obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])
        ? sortObject(obj[key] as Record<string, unknown>)
        : obj[key];
      return result;
    }, {});
}

function verifySignature(body: Record<string, unknown>, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(JSON.stringify(sortObject(body)));
  const expectedSignature = hmac.digest('hex');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  // timingSafeEqual requires equal-length buffers
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

export async function POST(request: Request) {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.error('[NOWPayments Webhook] NOWPAYMENTS_IPN_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const signature = request.headers.get('x-nowpayments-sig');

    if (!signature) {
      console.error('[NOWPayments Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify IPN signature
    if (!verifySignature(body, signature, ipnSecret)) {
      console.error('[NOWPayments Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const { payment_status, order_id, payment_id } = body;

    console.log(`[NOWPayments Webhook] Status: ${payment_status}, Order: ${order_id}, Payment: ${payment_id}`);

    // Extract user_id from order_id (format: edgetracker_{userId})
    if (!order_id || !order_id.startsWith('edgetracker_')) {
      console.error('[NOWPayments Webhook] Invalid order_id format:', order_id);
      return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 });
    }

    const userId = order_id.replace('edgetracker_', '');
    const supabaseAdmin = getSupabaseAdmin();

    // Update payment status on all status changes
    const updateData: Record<string, unknown> = {
      payment_status,
      payment_id: payment_id?.toString() || null,
      payment_provider: 'nowpayments',
    };

    // On confirmed/finished/partially_paid: upgrade to paid
    // partially_paid covers cases where network fees cause slight underpayment
    if (payment_status === 'finished' || payment_status === 'confirmed' || payment_status === 'partially_paid') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      updateData.subscription_tier = 'paid';
      updateData.current_period_start = now.toISOString();
      updateData.current_period_end = periodEnd.toISOString();

      console.log(`[NOWPayments Webhook] Upgrading user ${userId} to paid`);
    }

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      console.error('[NOWPayments Webhook] DB update error:', error.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[NOWPayments Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
