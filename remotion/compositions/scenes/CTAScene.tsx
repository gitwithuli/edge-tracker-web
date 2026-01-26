import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Logo} from '../../components/Logo';
import {GrainOverlay} from '../../components/GrainOverlay';
import {BRAND, getScale} from '../../brand';

type CTASceneProps = {
  headline?: string;
  subtext?: string;
  ctaText?: string;
};

export const CTAScene: React.FC<CTASceneProps> = ({
  headline = 'Stop guessing.',
  subtext = 'Start tracking.',
  ctaText = 'edgeofict.com',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = getScale(width);

  const isVertical = height > width;
  const isSquare = Math.abs(width - height) < 100;

  const headlineEntrance = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const subtextEntrance = spring({
    frame: frame - 0.3 * fps,
    fps,
    config: {damping: 200},
  });

  const ctaEntrance = spring({
    frame: frame - 0.6 * fps,
    fps,
    config: {damping: 15, stiffness: 200},
  });

  const logoEntrance = spring({
    frame: frame - 0.8 * fps,
    fps,
    config: {damping: 200},
  });

  const headlineOpacity = interpolate(headlineEntrance, [0, 1], [0, 1]);
  const headlineY = interpolate(headlineEntrance, [0, 1], [40, 0]);

  const subtextOpacity = interpolate(subtextEntrance, [0, 1], [0, 1]);
  const subtextY = interpolate(subtextEntrance, [0, 1], [30, 0]);

  const ctaOpacity = interpolate(ctaEntrance, [0, 1], [0, 1]);
  const ctaScale = interpolate(ctaEntrance, [0, 1], [0.8, 1]);

  const logoOpacity = interpolate(logoEntrance, [0, 1], [0, 1]);

  const fontSize = isVertical ? width * 0.1 : isSquare ? width * 0.08 : width * 0.055;

  return (
    <AbsoluteFill
      style={{
        background: BRAND.gradients.background,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: (isVertical ? 30 : 20) * s,
      }}
    >
      <GrainOverlay opacity={0.03} />

      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontSize,
            fontWeight: 400,
            color: BRAND.colors.textPrimary,
            fontFamily: 'Inter, sans-serif',
            opacity: headlineOpacity,
            transform: `translateY(${headlineY * s}px)`,
            letterSpacing: '-0.02em',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: fontSize * 0.9,
            fontWeight: 400,
            color: BRAND.colors.gold,
            fontFamily: 'Inter, sans-serif',
            opacity: subtextOpacity,
            transform: `translateY(${subtextY * s}px)`,
            marginTop: 8 * s,
            letterSpacing: '-0.02em',
          }}
        >
          {subtext}
        </div>
      </div>

      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          marginTop: (isVertical ? 40 : 30) * s,
          background: BRAND.colors.gold,
          color: BRAND.colors.backgroundGradientStart,
          padding: `${(isVertical ? 16 : 14) * s}px ${(isVertical ? 40 : 36) * s}px`,
          borderRadius: 50 * s,
          fontSize: (isVertical ? 18 : isSquare ? 18 : 20) * s,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          boxShadow: `0 ${8 * s}px ${32 * s}px ${BRAND.colors.gold}40`,
        }}
      >
        {ctaText}
      </div>

      <div
        style={{
          opacity: logoOpacity,
          marginTop: (isVertical ? 50 : 40) * s,
        }}
      >
        <Logo size={(isVertical ? 40 : isSquare ? 50 : 50) * s} iconScale={1.5} />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: (isVertical ? 40 : 30) * s,
          fontSize: 14 * s,
          color: BRAND.colors.textMuted,
          fontFamily: 'Inter, sans-serif',
          opacity: logoOpacity,
        }}
      >
        Built for ICT traders, by ICT traders
      </div>
    </AbsoluteFill>
  );
};
