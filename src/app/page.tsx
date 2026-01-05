"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/hooks/use-edge-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const { user, isLoaded } = useEdgeStore();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, get them out of the landing page
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-zinc-800">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-zinc-900">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
           <TrendingUp className="w-6 h-6 text-zinc-100" /> EdgeTracker V2
        </div>
        <div className="flex gap-4">
          <Link href="/login"><Button variant="ghost">Login</Button></Link>
          <Link href="/login"><Button className="bg-white text-black">Get Started</Button></Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 pt-24 text-center">
        <h1 className="text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Track Your Edge <br/> With Surgical Precision.
        </h1>
        <Link href="/login">
          <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-10 py-7 text-lg">
            Start Your Journal <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </main>
    </div>
  );
}