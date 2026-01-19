import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Handle Vercel's forwarded host for proper redirects in production
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  let redirectBase: string;
  if (isLocalEnv) {
    redirectBase = origin;
  } else if (forwardedHost) {
    redirectBase = `https://${forwardedHost}`;
  } else {
    redirectBase = origin;
  }

  if (!code) {
    console.error('Auth callback: No code provided');
    return NextResponse.redirect(`${redirectBase}/gate-7k9x?error=no_code`);
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message, error);
    return NextResponse.redirect(`${redirectBase}/gate-7k9x?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    console.error('Auth callback: No session returned');
    return NextResponse.redirect(`${redirectBase}/gate-7k9x?error=no_session`);
  }

  // Success - redirect to dashboard
  return NextResponse.redirect(`${redirectBase}/dashboard`);
}
