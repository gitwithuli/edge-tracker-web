import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Calendar, Target, CheckCircle, XCircle } from 'lucide-react';
import { SharePageHeader } from './header';

// Use anon key for public data - RLS policy allows reading public edges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PublicEdge {
  id: string;
  name: string;
  description: string;
  public_slug: string;
  show_trades: boolean;
  show_screenshots: boolean;
}

interface PublicLog {
  id: string;
  result: 'OCCURRED' | 'NO_SETUP';
  outcome: 'WIN' | 'LOSS' | null;
  log_type: string;
  day_of_week: string;
  duration_minutes: number;
  date: string;
  tv_links: string[];
}

async function getPublicEdge(slug: string): Promise<{ edge: PublicEdge; logs: PublicLog[] } | null> {
  const { data: edge, error } = await supabase
    .from('edges')
    .select('id, name, description, public_slug, show_trades, show_screenshots')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single();

  if (error || !edge) {
    return null;
  }

  // Fetch logs if show_trades is enabled
  let logs: PublicLog[] = [];
  if (edge.show_trades) {
    const { data: logsData } = await supabase
      .from('logs')
      .select('id, result, outcome, log_type, day_of_week, duration_minutes, date, tv_links')
      .eq('edge_id', edge.id)
      .order('date', { ascending: false })
      .limit(100);

    logs = logsData || [];
  }

  return { edge, logs };
}

function calculateStats(logs: PublicLog[]) {
  const occurrences = logs.filter(l => l.result === 'OCCURRED');
  const wins = occurrences.filter(l => l.outcome === 'WIN').length;
  const losses = occurrences.filter(l => l.outcome === 'LOSS').length;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const occurrenceRate = logs.length > 0 ? Math.round((occurrences.length / logs.length) * 100) : 0;

  return {
    totalLogs: logs.length,
    totalTrades,
    wins,
    losses,
    winRate,
    occurrenceRate,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicEdge(slug);

  if (!data) {
    return {
      title: 'Edge Not Found',
    };
  }

  const stats = calculateStats(data.logs);

  return {
    title: `${data.edge.name} - Edge Tracker`,
    description: `Win rate: ${stats.winRate}% | ${stats.totalTrades} trades tracked`,
    openGraph: {
      title: `${data.edge.name} - Edge Tracker`,
      description: `Win rate: ${stats.winRate}% | ${stats.totalTrades} trades`,
      images: [`/api/og/edge/${slug}`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.edge.name} - Edge Tracker`,
      description: `Win rate: ${stats.winRate}% | ${stats.totalTrades} trades`,
      images: [`/api/og/edge/${slug}`],
    },
  };
}

export default async function SharedEdgePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicEdge(slug);

  if (!data) {
    notFound();
  }

  const { edge, logs } = data;
  const stats = calculateStats(logs);

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F0F0F] text-[#0F0F0F] dark:text-white">
      <SharePageHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Edge Title */}
        <div className="mb-8">
          <p className="text-[#C45A3B] text-[10px] sm:text-xs tracking-[0.3em] uppercase font-medium mb-2">
            Shared Edge
          </p>
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-2"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            {edge.name}
          </h1>
          {edge.description && (
            <p className="text-[#0F0F0F]/60 dark:text-white/60 max-w-2xl">
              {edge.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-[#0F0F0F]/10 dark:border-white/10">
            <div className="flex items-center gap-2 text-[#0F0F0F]/40 dark:text-white/40 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              Win Rate
            </div>
            <p className="text-2xl font-semibold">{stats.winRate}%</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-[#0F0F0F]/10 dark:border-white/10">
            <div className="flex items-center gap-2 text-[#0F0F0F]/40 dark:text-white/40 text-xs mb-1">
              <Calendar className="w-3 h-3" />
              Total Trades
            </div>
            <p className="text-2xl font-semibold">{stats.totalTrades}</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-[#0F0F0F]/10 dark:border-white/10">
            <div className="flex items-center gap-2 text-[#8B9A7D] text-xs mb-1">
              <CheckCircle className="w-3 h-3" />
              Wins
            </div>
            <p className="text-2xl font-semibold text-[#8B9A7D]">{stats.wins}</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-[#0F0F0F]/10 dark:border-white/10">
            <div className="flex items-center gap-2 text-[#C45A3B] text-xs mb-1">
              <XCircle className="w-3 h-3" />
              Losses
            </div>
            <p className="text-2xl font-semibold text-[#C45A3B]">{stats.losses}</p>
          </div>
        </div>

        {/* Occurrence Rate */}
        <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-[#0F0F0F]/10 dark:border-white/10 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#0F0F0F]/40 dark:text-white/40 text-xs mb-1">
                <Target className="w-3 h-3" />
                Occurrence Rate
              </div>
              <p className="text-xl font-semibold">{stats.occurrenceRate}%</p>
            </div>
            <p className="text-sm text-[#0F0F0F]/50 dark:text-white/50">
              {stats.totalLogs} days logged
            </p>
          </div>
        </div>

        {/* Trade History */}
        {edge.show_trades && logs.length > 0 && (
          <div>
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#0F0F0F]/40 dark:text-white/40 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-2">
              {logs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="bg-white dark:bg-white/5 rounded-lg p-3 border border-[#0F0F0F]/10 dark:border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      log.result === 'NO_SETUP'
                        ? 'bg-[#0F0F0F]/20 dark:bg-white/20'
                        : log.outcome === 'WIN'
                        ? 'bg-[#8B9A7D]'
                        : 'bg-[#C45A3B]'
                    }`} />
                    <span className="text-sm">
                      {log.result === 'NO_SETUP'
                        ? 'No Setup'
                        : log.outcome === 'WIN'
                        ? 'Win'
                        : 'Loss'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#0F0F0F]/40 dark:text-white/40">
                    <span>{log.day_of_week}</span>
                    <span>{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center p-8 bg-[#0F0F0F]/5 dark:bg-white/5 rounded-2xl">
          <h2
            className="text-xl sm:text-2xl mb-3"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Track your own <span className="italic">edge</span>
          </h2>
          <p className="text-[#0F0F0F]/60 dark:text-white/60 mb-6 max-w-md mx-auto">
            Join traders who track their setups and build discipline through data.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-[#0F0F0F] dark:bg-white text-[#FAF7F2] dark:text-[#0F0F0F] px-6 py-3 rounded-full font-medium hover:bg-[#C45A3B] dark:hover:bg-[#C45A3B] dark:hover:text-white transition-colors"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#0F0F0F]/5 dark:border-white/5 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-[#0F0F0F]/30 dark:text-white/30">
          <span className="flex items-center gap-2 tracking-[0.15em] uppercase">
            <img src="/logo-icon-transparent.png" alt="" className="w-4 h-4" />
            Edge of ICT
          </span>
          <span>Built for ICT traders</span>
        </div>
      </footer>
    </div>
  );
}
