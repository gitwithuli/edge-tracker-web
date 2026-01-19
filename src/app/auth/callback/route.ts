import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Handle Vercel's forwarded host for proper redirects in production
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  // Determine the correct redirect base URL
  let redirectBase: string;
  if (isLocalEnv) {
    redirectBase = origin;
  } else if (forwardedHost) {
    redirectBase = `https://${forwardedHost}`;
  } else {
    redirectBase = origin;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${redirectBase}/dashboard`);
    }

    console.error('Auth callback error:', error.message);
  }

  // Redirect to login on error or missing code
  return NextResponse.redirect(`${redirectBase}/gate-7k9x?error=auth_failed`);
}
