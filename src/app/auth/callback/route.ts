import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  if (error) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDescription ?? error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'Missing authorization code');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.');
      return NextResponse.redirect(loginUrl);
    }

    const redirectTo = requestUrl.searchParams.get('redirect') ?? '/dashboard';
    const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    return NextResponse.redirect(`${origin}${safeRedirect}`);
  } catch {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'An unexpected error occurred');
    return NextResponse.redirect(loginUrl);
  }
}
