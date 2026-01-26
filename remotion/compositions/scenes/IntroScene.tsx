import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Logo} from '../../components/Logo';
import {GrainOverlay} from '../../components/GrainOverlay';
import {BRAND, getScale} from '../../brand';

type IntroSceneProps = {
  tagline?: string;
  subtitle?: string;
};

export const IntroScene: React.FC<IntroSceneProps> = ({
  tagline = 'Track the',
  subtitle = 'of your edge.',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const s = getScale(width);

  const logoEntrance = spring({
    frame,
    fps,
    config: {damping: 200},
  });

  const taglineDelay = 0.4 * fps;
  const taglineEntrance = spring({
    frame: frame - taglineDelay,
    fps,
    config: {damping: 200},
  });

  const subtitleDelay = 0.6 * fps;
  const subtitleEntrance = spring({
    frame: frame - subtitleDelay,
    fps,
    config: {damping: 200},
  });

  const taglineOpacity = interpolate(taglineEntrance, [0, 1], [0, 1]);
  const taglineY = interpolate(taglineEntrance, [0, 1], [40, 0]);

  const subtitleOpacity = interpolate(subtitleEntrance, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleEntrance, [0, 1], [30, 0]);

  const isVertical = height > width;
  const isSquare = Math.abs(width - height) < 100;
  const fontSize = isVertical ? width * 0.1 : isSquare ? width * 0.08 : width * 0.055;
  const subtitleSize = isVertical ? width * 0.09 : isSquare ? width * 0.07 : width * 0.05;

  return (
    <AbsoluteFill
      style={{
        background: BRAND.gradients.background,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: (isVertical ? 40 : 30) * s,
      }}
    >
      <GrainOverlay opacity={0.03} />

      <div style={{opacity: logoEntrance, transform: `scale(${interpolate(logoEntrance, [0, 1], [0.8, 1])})`}}>
        <Logo size={(isVertical ? 70 : isSquare ? 80 : 70) * s} iconScale={2} layout="vertical" />
      </div>

      <div style={{textAlign: 'center', marginTop: (isVertical ? 60 : 40) * s}}>
        <div
          style={{
            fontSize,
            fontWeight: 300,
            color: BRAND.colors.textPrimary,
            fontFamily: 'Inter, sans-serif',
            opacity: taglineOpacity,
            transform: `translateY(${taglineY * s}px)`,
            letterSpacing: '-0.02em',
          }}
        >
          {tagline}
          <span style={{fontStyle: 'italic', color: BRAND.colors.gold}}> rhythm</span>
        </div>
        <div
          style={{
            fontSize: subtitleSize,
            fontWeight: 300,
            color: BRAND.colors.textSecondary,
            fontFamily: 'Inter, sans-serif',
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY * s}px)`,
            marginTop: 8 * s,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
