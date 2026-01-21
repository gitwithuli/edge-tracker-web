"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Send, Instagram, Facebook, Twitter, CheckCircle, Loader2 } from "lucide-react";
import { GrainOverlay } from "@/components/grain-overlay";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormState({ name: "", email: "", message: "" });

      setTimeout(() => {
        router.push("/dashboard");
      }, 3500);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] relative overflow-hidden">
      <GrainOverlay />

      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.03] dark:opacity-[0.02]"
          style={{
            background: "radial-gradient(circle, #C45A3B 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.04] dark:opacity-[0.02]"
          style={{
            background: "radial-gradient(circle, #8B9A7D 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-2">
          <Link
            href="/dashboard"
            className={`p-2 rounded-full text-[#0F0F0F]/40 dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white hover:bg-[#0F0F0F]/5 dark:hover:bg-white/10 transition-all duration-300 opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
            title="Back to Dashboard"
          >
            <Home className="w-4 h-4" />
          </Link>
          <div className={`opacity-0 ${mounted ? 'animate-fade-in' : ''}`} style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">

          {/* Hero Section */}
          <section className="pt-8 pb-16 sm:pt-12 sm:pb-24">
            <p
              className={`text-[#C45A3B] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-4 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              About Edge Tracker
            </p>
            <h1
              className={`font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0F0F0F] dark:text-white leading-[1.2] mb-6 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
            >
              Built for traders who<br />
              <span className="text-[#C45A3B]">take their edge seriously</span>
            </h1>
            <p
              className={`text-[#0F0F0F]/60 dark:text-white/60 text-base sm:text-lg max-w-2xl leading-relaxed opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
            >
              Edge Tracker is a focused trading journal designed to help you document,
              analyze, and refine your trading strategies. No clutter, no distractions —
              just the tools you need to track what works and cut what doesn't.
            </p>
          </section>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

            {/* Left Column - Philosophy & Social */}
            <div>
              {/* Philosophy */}
              <div
                className={`mb-12 opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
              >
                <h2 className="font-serif text-xl sm:text-2xl text-[#0F0F0F] dark:text-white mb-4">
                  Our Philosophy
                </h2>
                <div className="space-y-4 text-[#0F0F0F]/60 dark:text-white/60 leading-relaxed">
                  <p>
                    Every trade tells a story. We believe that consistent profitability
                    comes from understanding your patterns — both the winning ones and
                    the ones that cost you.
                  </p>
                  <p>
                    Edge Tracker helps you see the bigger picture while keeping track of
                    every detail that matters. Because in trading, the edge is in the details.
                  </p>
                </div>
              </div>

              {/* Connect Section */}
              <div
                className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
              >
                <h2 className="font-serif text-xl sm:text-2xl text-[#0F0F0F] dark:text-white mb-6">
                  Connect With Us
                </h2>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/edgeofict/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-4 rounded-2xl bg-[#0F0F0F]/[0.03] dark:bg-white/[0.03] hover:bg-[#0F0F0F]/[0.06] dark:hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCAF45 100%)", opacity: 0.1 }} />
                    <Instagram className="relative w-6 h-6 text-[#0F0F0F]/70 dark:text-white/70 group-hover:text-[#C13584] transition-colors duration-300" />
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61586670905754"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-4 rounded-2xl bg-[#0F0F0F]/[0.03] dark:bg-white/[0.03] hover:bg-[#0F0F0F]/[0.06] dark:hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-[#1877F2] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <Facebook className="relative w-6 h-6 text-[#0F0F0F]/70 dark:text-white/70 group-hover:text-[#1877F2] transition-colors duration-300" />
                  </a>
                  <a
                    href="https://x.com/edgeofict"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-4 rounded-2xl bg-[#0F0F0F]/[0.03] dark:bg-white/[0.03] hover:bg-[#0F0F0F]/[0.06] dark:hover:bg-white/[0.06] transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-[#0F0F0F] dark:bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <Twitter className="relative w-6 h-6 text-[#0F0F0F]/70 dark:text-white/70 group-hover:text-[#0F0F0F] dark:group-hover:text-white transition-colors duration-300" />
                  </a>
                </div>
                <p className="mt-4 text-sm text-[#0F0F0F]/40 dark:text-white/40">
                  Follow along for trading insights and updates
                </p>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div
              className={`opacity-0 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: "0.7s", animationFillMode: "forwards" }}
            >
              <div className="relative">
                {/* Form container with subtle border */}
                <div
                  className="relative p-6 sm:p-8 rounded-3xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(15,15,15,0.02) 0%, rgba(15,15,15,0.04) 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(15,15,15,0.06)",
                  }}
                >
                  <div className="dark:hidden absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(135deg, rgba(15,15,15,0.02) 0%, rgba(15,15,15,0.04) 100%)", boxShadow: "inset 0 0 0 1px rgba(15,15,15,0.06)" }} />
                  <div className="hidden dark:block absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.04) 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }} />

                  <div className="relative">
                    <h2 className="font-serif text-xl sm:text-2xl text-[#0F0F0F] dark:text-white mb-2">
                      Drop us a message
                    </h2>
                    <p className="text-[#0F0F0F]/50 dark:text-white/50 text-sm mb-6">
                      Got feedback, questions, or just want to say hi? We'd love to hear from you.
                    </p>

                    {isSubmitted ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-[#8B9A7D]/10 flex items-center justify-center mb-4">
                          <CheckCircle className="w-8 h-8 text-[#8B9A7D]" />
                        </div>
                        <h3 className="font-serif text-lg text-[#0F0F0F] dark:text-white mb-2">
                          Message received!
                        </h3>
                        <p className="text-sm text-[#0F0F0F]/50 dark:text-white/50 mb-4">
                          Thanks for reaching out. We'll get back to you within 24 hours.
                        </p>
                        <p className="text-xs text-[#0F0F0F]/30 dark:text-white/30">
                          Redirecting to dashboard...
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                          <label htmlFor="name" className="block text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={formState.name}
                            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#0F0F0F]/[0.03] dark:bg-white/[0.05] border-0 text-[#0F0F0F] dark:text-white placeholder-[#0F0F0F]/30 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C45A3B]/30 transition-all duration-300"
                            placeholder="Your name"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={formState.email}
                            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-[#0F0F0F]/[0.03] dark:bg-white/[0.05] border-0 text-[#0F0F0F] dark:text-white placeholder-[#0F0F0F]/30 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C45A3B]/30 transition-all duration-300"
                            placeholder="your@email.com"
                          />
                        </div>

                        <div>
                          <label htmlFor="message" className="block text-xs uppercase tracking-wider text-[#0F0F0F]/40 dark:text-white/40 mb-2">
                            Message
                          </label>
                          <textarea
                            id="message"
                            value={formState.message}
                            onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                            required
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-[#0F0F0F]/[0.03] dark:bg-white/[0.05] border-0 text-[#0F0F0F] dark:text-white placeholder-[#0F0F0F]/30 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#C45A3B]/30 transition-all duration-300 resize-none"
                            placeholder="Share your thoughts, feedback, or just say hello..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="group relative w-full py-3.5 px-6 rounded-xl bg-[#C45A3B] text-white font-medium overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#C45A3B]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                Send Message
                              </>
                            )}
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-[#C45A3B] via-[#d4694a] to-[#C45A3B] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer tagline */}
          <div
            className={`mt-20 pt-12 border-t border-[#0F0F0F]/[0.06] dark:border-white/[0.06] text-center opacity-0 ${mounted ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: "0.9s", animationFillMode: "forwards" }}
          >
            <p className="text-[#0F0F0F]/30 dark:text-white/30 text-sm">
              Trade with conviction. Track with precision.
            </p>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
