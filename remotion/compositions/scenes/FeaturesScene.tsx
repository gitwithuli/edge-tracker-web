import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {GrainOverlay} from '../../components/GrainOverlay';
import {BRAND, getScale} from '../../brand';

const TrackIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <circle cx="24" cy="24" r="14" stroke={color} strokeWidth="1.5" opacity="0.5" />
    <circle cx="24" cy="24" r="8" stroke={color} strokeWidth="1.5" opacity="0.7" />
    <circle cx="24" cy="24" r="3" fill={color} />
    <line x1="24" y1="0" x2="24" y2="8" stroke={color} strokeWidth="1.5" />
    <line x1="24" y1="40" x2="24" y2="48" stroke={color} strokeWidth="1.5" />
    <line x1="0" y1="24" x2="8" y2="24" stroke={color} strokeWidth="1.5" />
    <line x1="40" y1="24" x2="48" y2="24" stroke={color} strokeWidth="1.5" />
  </svg>
);

const ChartIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="4" y="36" width="6" height="8" fill={color} opacity="0.4" />
    <rect x="14" y="28" width="6" height="16" fill={color} opacity="0.6" />
    <rect x="24" y="20" width="6" height="24" fill={color} opacity="0.8" />
    <rect x="34" y="8" width="6" height="36" fill={color} />
    <path d="M4 32L14 24L24 28L34 12L44 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="44" cy="4" r="3" fill={color} />
  </svg>
);

const JournalIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="8" y="4" width="32" height="40" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
    <rect x="4" y="8" width="4" height="32" fill={color} opacity="0.3" />
    <line x1="14" y1="14" x2="34" y2="14" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <line x1="14" y1="22" x2="34" y2="22" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <line x1="14" y1="30" x2="28" y2="30" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <circle cx="36" cy="36" r="8" fill={color} opacity="0.2" />
    <path d="M33 36L35 38L39 34" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Feature = {
  Icon: React.FC<{size: number; color: string}>;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
};

const features: Feature[] = [
  {
    Icon: TrackIcon,
    title: 'Track Occurrences',
    description: 'Log whether your edge appeared each day. Build real data.',
    stat: 'Daily',
    statLabel: 'Logging',
  },
  {
    Icon: ChartIcon,
    title: 'Backtest Patterns',
    description: 'Discover which days your edge shows up most.',
    stat: 'Find',
    statLabel: 'Your Windows',
  },
  {
    Icon: JournalIcon,
    title: 'Visual Journal',
    description: 'Attach charts, add notes, review your setups.',
    stat: 'Review',
    statLabel: 'With Clarity',
  },
];

type FeaturesSceneProps = {
  title?: string;
};

export const FeaturesScene: React.FC<FeaturesSceneProps> = ({
  title = 'Built for ICT Traders',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = getScale(width);

  const isVertical = height > width;
  const isSquare = Math.abs(width - height) < 100;

  const titleEntrance = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const subtitleEntrance = spring({
    frame: frame - 0.15 * fps,
    fps,
    config: {damping: 200},
  });

  const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1]);
  const titleY = interpolate(titleEntrance, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(subtitleEntrance, [0, 1], [0, 1]);

  const lineWidth = interpolate(
    frame,
    [0.2 * fps, 0.8 * fps],
    [0, (isSquare ? 300 : 400) * s],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  return (
    <AbsoluteFill
      style={{
        background: BRAND.gradients.background,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: (isVertical ? 40 : isSquare ? 60 : 80) * s,
      }}
    >
      <GrainOverlay opacity={0.025} />

      {/* Decorative corner accents */}
      <div
        style={{
          position: 'absolute',
          top: 40 * s,
          left: 40 * s,
          width: 60 * s,
          height: 60 * s,
          borderLeft: `${2 * s}px solid ${BRAND.colors.gold}`,
          borderTop: `${2 * s}px solid ${BRAND.colors.gold}`,
          opacity: 0.3,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 40 * s,
          right: 40 * s,
          width: 60 * s,
          height: 60 * s,
          borderRight: `${2 * s}px solid ${BRAND.colors.gold}`,
          borderBottom: `${2 * s}px solid ${BRAND.colors.gold}`,
          opacity: 0.3,
        }}
      />

      {/* Header section */}
      <div style={{textAlign: 'center', marginBottom: (isSquare ? 50 : 60) * s}}>
        <div
          style={{
            fontSize: 12 * s,
            fontWeight: 500,
            color: BRAND.colors.gold,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            opacity: subtitleOpacity,
            marginBottom: 16 * s,
          }}
        >
          Features
        </div>
        <div
          style={{
            fontSize: (isVertical ? 36 : isSquare ? 44 : 48) * s,
            fontWeight: 300,
            color: BRAND.colors.textPrimary,
            fontFamily: 'Inter, sans-serif',
            opacity: titleOpacity,
            transform: `translateY(${titleY * s}px)`,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
        {/* Animated underline */}
        <div
          style={{
            width: lineWidth,
            height: 1 * s,
            background: `linear-gradient(90deg, transparent 0%, ${BRAND.colors.gold} 50%, transparent 100%)`,
            margin: `${20 * s}px auto 0`,
          }}
        />
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          gap: (isVertical ? 24 : isSquare ? 20 : 30) * s,
          alignItems: 'stretch',
        }}
      >
        {features.map((feature, index) => {
          const featureEntrance = spring({
            frame: frame - (0.4 + index * 0.15) * fps,
            fps,
            config: {damping: 200},
          });

          const opacity = interpolate(featureEntrance, [0, 1], [0, 1]);
          const translateY = interpolate(featureEntrance, [0, 1], [50 * s, 0]);
          const scale = interpolate(featureEntrance, [0, 1], [0.95, 1]);

          const cardWidth = isVertical
            ? width * 0.85
            : isSquare
              ? width * 0.28
              : width * 0.24;

          const iconGlow = interpolate(
            frame,
            [0, fps * 2, fps * 4],
            [0, 0.4, 0],
            {extrapolateRight: 'extend'}
          );

          return (
            <div
              key={feature.title}
              style={{
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                width: cardWidth,
                position: 'relative',
              }}
            >
              {/* Card glow effect */}
              <div
                style={{
                  position: 'absolute',
                  inset: -1 * s,
                  background: `linear-gradient(135deg, ${BRAND.colors.gold}20 0%, transparent 50%, ${BRAND.colors.green}20 100%)`,
                  borderRadius: 16 * s,
                  opacity: 0.5,
                }}
              />

              {/* Main card */}
              <div
                style={{
                  position: 'relative',
                  background: `linear-gradient(180deg, ${BRAND.colors.greenDark}80 0%, ${BRAND.colors.backgroundGradientStart}90 100%)`,
                  border: `${1 * s}px solid ${BRAND.colors.green}40`,
                  borderRadius: 14 * s,
                  padding: (isVertical ? 28 : isSquare ? 24 : 32) * s,
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Icon container */}
                <div
                  style={{
                    width: (isSquare ? 64 : 72) * s,
                    height: (isSquare ? 64 : 72) * s,
                    margin: `0 auto ${20 * s}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Icon glow */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `radial-gradient(circle, ${BRAND.colors.gold}30 0%, transparent 70%)`,
                      opacity: iconGlow,
                      borderRadius: '50%',
                      transform: 'scale(1.5)',
                    }}
                  />
                  <feature.Icon size={(isSquare ? 44 : 48) * s} color={BRAND.colors.gold} />
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: (isVertical ? 20 : isSquare ? 18 : 20) * s,
                    fontWeight: 600,
                    color: BRAND.colors.textPrimary,
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: 10 * s,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {feature.title}
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: (isVertical ? 14 : isSquare ? 13 : 14) * s,
                    fontWeight: 400,
                    color: BRAND.colors.textSecondary,
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.6,
                    marginBottom: 20 * s,
                  }}
                >
                  {feature.description}
                </div>

                {/* Stat divider */}
                <div
                  style={{
                    width: '100%',
                    height: 1 * s,
                    background: `linear-gradient(90deg, transparent 0%, ${BRAND.colors.green}60 50%, transparent 100%)`,
                    marginBottom: 16 * s,
                  }}
                />

                {/* Stat */}
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 * s}}>
                  <span
                    style={{
                      fontSize: (isSquare ? 22 : 24) * s,
                      fontWeight: 600,
                      color: BRAND.colors.gold,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {feature.stat}
                  </span>
                  <span
                    style={{
                      fontSize: 12 * s,
                      fontWeight: 500,
                      color: BRAND.colors.textMuted,
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {feature.statLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
