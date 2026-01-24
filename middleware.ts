import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// Admin client for subscription checks (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Routes that don't require authentication at all
const publicRoutes = [
  '/',
  '/login',
  '/pricing',
  '/about',
  '/auth/callback',
  '/auth/callback/client',
];

// Routes that should redirect to dashboard if already logged in AND paid
const authRoutes = [
  '/login',
];

// Routes that authenticated users can access without subscription
const freeAuthenticatedRoutes = [
  '/pricing',
];

function isPublicRoute(pathname: string): boolean {
  // Exact match or starts with /share/ (public edge pages) or /api/
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/api/')
  );
}

function isFreeAuthenticatedRoute(pathname: string): boolean {
  return freeAuthenticatedRoutes.includes(pathname);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - important for keeping the session alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if it's an auth route (login pages)
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // If user is logged in and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // If user is not logged in and trying to access protected route, redirect to landing page
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // If user is logged in but route requires subscription, check subscription
  if (user && !isPublicRoute(pathname) && !isFreeAuthenticatedRoute(pathname)) {
    console.log('[Middleware] Checking subscription for user:', user.id, 'pathname:', pathname);

    // Use admin client to bypass RLS
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    console.log('[Middleware] Subscription result:', subscription, 'error:', subError);

    // If no subscription or unpaid, redirect to pricing
    if (!subscription || subscription.subscription_tier !== 'paid') {
      console.log('[Middleware] Redirecting to /pricing - subscription:', subscription?.subscription_tier);
      const url = request.nextUrl.clone();
      url.pathname = '/pricing';
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
    console.log('[Middleware] User is paid, allowing access');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
