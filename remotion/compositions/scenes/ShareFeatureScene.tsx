import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ScreenshotDisplay} from '../../components/ScreenshotDisplay';
import {GrainOverlay} from '../../components/GrainOverlay';
import {BRAND, getScale} from '../../brand';

type ShareFeatureSceneProps = {
  title?: string;
  subtitle?: string;
};

export const ShareFeatureScene: React.FC<ShareFeatureSceneProps> = ({
  title = 'Share Your Edge',
  subtitle = 'Download stats for social media',
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
    frame: frame - 0.3 * fps,
    fps,
    config: {damping: 200},
  });

  const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1]);
  const titleY = interpolate(titleEntrance, [0, 1], [30, 0]);

  const subtitleOpacity = interpolate(subtitleEntrance, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleEntrance, [0, 1], [20, 0]);

  const screenshotWidth = isVertical
    ? width * 0.85
    : isSquare
      ? width * 0.75
      : width * 0.55;

  return (
    <AbsoluteFill
      style={{
        background: BRAND.gradients.background,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: (isVertical ? 25 : 15) * s,
        padding: (isVertical ? 40 : 60) * s,
      }}
    >
      <GrainOverlay opacity={0.03} />

      <div style={{textAlign: 'center', marginBottom: (isVertical ? 20 : 10) * s}}>
        <div
          style={{
            fontSize: (isVertical ? 28 : isSquare ? 32 : 36) * s,
            fontWeight: 400,
            color: BRAND.colors.textPrimary,
            fontFamily: 'Inter, sans-serif',
            opacity: titleOpacity,
            transform: `translateY(${titleY * s}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: (isVertical ? 16 : isSquare ? 18 : 20) * s,
            fontWeight: 400,
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

      <ScreenshotDisplay
        src="demo/edge-detail-share.png"
        delay={0.4}
        width={screenshotWidth}
        borderRadius={16 * s}
        zoomStart={1}
        zoomEnd={1.02}
      />
    </AbsoluteFill>
  );
};
