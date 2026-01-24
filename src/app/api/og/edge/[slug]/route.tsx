import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PublicLog {
  result: 'OCCURRED' | 'NO_SETUP';
  outcome: 'WIN' | 'LOSS' | null;
}

function calculateStats(logs: PublicLog[]) {
  const occurrences = logs.filter(l => l.result === 'OCCURRED');
  const wins = occurrences.filter(l => l.outcome === 'WIN').length;
  const losses = occurrences.filter(l => l.outcome === 'LOSS').length;
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  return { totalTrades, wins, losses, winRate };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Fetch edge data
  const { data: edge, error } = await supabase
    .from('edges')
    .select('id, name')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single();

  if (error || !edge) {
    return new Response('Edge not found', { status: 404 });
  }

  // Fetch logs
  const { data: logs } = await supabase
    .from('logs')
    .select('result, outcome')
    .eq('edge_id', edge.id);

  const stats = calculateStats(logs || []);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0F0F0F',
          padding: '60px',
          fontFamily: 'system-ui',
        }}
      >
        {/* Top: Logo and Edge Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#C45A3B',
                borderRadius: '8px',
              }}
            />
            <span
              style={{
                color: '#FAF7F2',
                fontSize: '24px',
                letterSpacing: '0.1em',
                opacity: 0.6,
              }}
            >
              EDGE OF ICT
            </span>
          </div>
          <h1
            style={{
              color: '#FAF7F2',
              fontSize: '64px',
              fontWeight: '700',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {edge.name}
          </h1>
        </div>

        {/* Bottom: Stats */}
        <div style={{ display: 'flex', gap: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                color: '#FAF7F2',
                fontSize: '72px',
                fontWeight: '700',
                lineHeight: 1,
              }}
            >
              {stats.winRate}%
            </span>
            <span
              style={{
                color: '#FAF7F2',
                fontSize: '24px',
                opacity: 0.5,
              }}
            >
              Win Rate
            </span>
          </div>

          <div
            style={{
              width: '1px',
              backgroundColor: '#FAF7F2',
              opacity: 0.2,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                color: '#FAF7F2',
                fontSize: '72px',
                fontWeight: '700',
                lineHeight: 1,
              }}
            >
              {stats.totalTrades}
            </span>
            <span
              style={{
                color: '#FAF7F2',
                fontSize: '24px',
                opacity: 0.5,
              }}
            >
              Trades
            </span>
          </div>

          <div
            style={{
              width: '1px',
              backgroundColor: '#FAF7F2',
              opacity: 0.2,
            }}
          />

          <div style={{ display: 'flex', gap: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  color: '#8B9A7D',
                  fontSize: '48px',
                  fontWeight: '700',
                  lineHeight: 1,
                }}
              >
                {stats.wins}
              </span>
              <span
                style={{
                  color: '#8B9A7D',
                  fontSize: '20px',
                }}
              >
                Wins
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  color: '#C45A3B',
                  fontSize: '48px',
                  fontWeight: '700',
                  lineHeight: 1,
                }}
              >
                {stats.losses}
              </span>
              <span
                style={{
                  color: '#C45A3B',
                  fontSize: '20px',
                }}
              >
                Losses
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
