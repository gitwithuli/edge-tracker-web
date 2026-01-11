"use client";

import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function AnimatedChart() {
  const bars = [
    { height: 45, delay: 0.3 },
    { height: 65, delay: 0.4 },
    { height: 35, delay: 0.5 },
    { height: 80, delay: 0.6 },
    { height: 55, delay: 0.7 },
    { height: 70, delay: 0.8 },
    { height: 90, delay: 0.9 },
  ];

  return (
    <div className="flex items-end justify-center gap-3 h-32">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="w-4 rounded-t-sm bg-[#FAF7F2]/20 opacity-0 animate-[growUp_0.6s_ease-out_forwards]"
          style={{
            height: `${bar.height}%`,
            animationDelay: `${bar.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoaded } = useEdgeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes growUp {
          from {
            opacity: 0;
            transform: scaleY(0);
            transform-origin: bottom;
          }
          to {
            opacity: 1;
            transform: scaleY(1);
            transform-origin: bottom;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-up {
          animation: fadeSlideUp 0.8s ease-out forwards;
        }

        /* Custom Supabase Auth UI overrides */
        [data-supabase-auth-ui] {
          --colors-brand: #0F0F0F;
          --colors-brandAccent: #C45A3B;
        }

        .supabase-auth-ui_ui-button {
          font-family: system-ui, -apple-system, sans-serif !important;
          font-weight: 500 !important;
          letter-spacing: 0.02em !important;
          transition: all 0.3s ease !important;
        }

        .supabase-auth-ui_ui-input {
          font-family: system-ui, -apple-system, sans-serif !important;
          border-radius: 12px !important;
        }

        .supabase-auth-ui_ui-label {
          font-family: system-ui, -apple-system, sans-serif !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
        }
      `}</style>

      <GrainOverlay />

      <div className="min-h-screen flex">
        {/* Left Panel - Brand/Visual */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0F0F0F] relative overflow-hidden">
          {/* Gradient orb */}
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#C45A3B]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[#8B9A7D]/10 rounded-full blur-[100px]" />

          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            {/* Logo */}
            <Link
              href="/"
              className={`inline-flex items-center gap-2 text-[#FAF7F2]/60 hover:text-[#FAF7F2] transition-colors text-sm opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
              style={{ animationDelay: '0.1s' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="tracking-[0.15em] uppercase">Back</span>
            </Link>

            {/* Center Content */}
            <div className="space-y-12">
              <div
                className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: '0.3s' }}
              >
                <AnimatedChart />
              </div>

              <div className="space-y-6">
                <h1
                  className={`text-4xl xl:text-5xl text-[#FAF7F2] leading-[1.1] tracking-tight opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                  style={{
                    fontFamily: "'Libre Baskerville', Georgia, serif",
                    animationDelay: '0.5s'
                  }}
                >
                  Track your edge.
                  <br />
                  <span className="italic text-[#FAF7F2]/60">Build your discipline.</span>
                </h1>

                <p
                  className={`text-[#FAF7F2]/40 max-w-sm leading-relaxed opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                  style={{ animationDelay: '0.6s' }}
                >
                  Join traders who understand that consistency comes from knowing when their setups truly appear.
                </p>
              </div>
            </div>

            {/* Footer */}
            <p
              className={`text-xs text-[#FAF7F2]/20 tracking-wider uppercase opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
              style={{ animationDelay: '0.8s' }}
            >
              EdgeTracker &mdash; Built for ICT traders
            </p>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 bg-[#FAF7F2] flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile back link */}
            <Link
              href="/"
              className={`lg:hidden inline-flex items-center gap-2 text-[#0F0F0F]/40 hover:text-[#0F0F0F] transition-colors text-sm mb-12 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="tracking-[0.15em] uppercase">Back</span>
            </Link>

            <div
              className={`space-y-2 mb-10 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.2s' }}
            >
              <h2
                className="text-3xl sm:text-4xl tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Welcome back
              </h2>
              <p className="text-[#0F0F0F]/50">
                Sign in to continue tracking your edge
              </p>
            </div>

            <div
              className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: '0.4s' }}
            >
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#0F0F0F',
                        brandAccent: '#C45A3B',
                        inputBackground: '#FAF7F2',
                        inputBorder: '#0F0F0F20',
                        inputBorderFocus: '#C45A3B',
                        inputBorderHover: '#0F0F0F40',
                        inputText: '#0F0F0F',
                        inputLabelText: '#0F0F0F80',
                        inputPlaceholder: '#0F0F0F40',
                        anchorTextColor: '#0F0F0F60',
                        anchorTextHoverColor: '#C45A3B',
                      },
                      borderWidths: {
                        buttonBorderWidth: '0px',
                        inputBorderWidth: '1px',
                      },
                      radii: {
                        borderRadiusButton: '100px',
                        buttonBorderRadius: '100px',
                        inputBorderRadius: '12px',
                      },
                      space: {
                        inputPadding: '14px 18px',
                        buttonPadding: '14px 24px',
                      },
                      fonts: {
                        bodyFontFamily: 'system-ui, -apple-system, sans-serif',
                        buttonFontFamily: 'system-ui, -apple-system, sans-serif',
                        inputFontFamily: 'system-ui, -apple-system, sans-serif',
                        labelFontFamily: 'system-ui, -apple-system, sans-serif',
                      },
                    },
                  },
                  style: {
                    button: {
                      fontWeight: '500',
                      fontSize: '14px',
                      letterSpacing: '0.02em',
                    },
                    anchor: {
                      fontSize: '13px',
                    },
                    label: {
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    },
                    input: {
                      fontSize: '15px',
                    },
                    divider: {
                      background: '#0F0F0F10',
                    },
                  },
                }}
                providers={["google"]}
                redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}
              />
            </div>

            <p
              className={`mt-10 text-center text-xs text-[#0F0F0F]/30 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
              style={{ animationDelay: '0.6s' }}
            >
              By signing in, you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
