import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ScreenshotDisplay} from '../../components/ScreenshotDisplay';
import {FeatureBadge} from '../../components/FeatureBadge';
import {GrainOverlay} from '../../components/GrainOverlay';
import {BRAND, getScale} from '../../brand';

type DashboardSceneProps = {
  showBadges?: boolean;
  title?: string;
};

export const DashboardScene: React.FC<DashboardSceneProps> = ({
  showBadges = true,
  title = 'Your Trading Dashboard',
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

  const titleOpacity = interpolate(titleEntrance, [0, 1], [0, 1]);
  const titleY = interpolate(titleEntrance, [0, 1], [30, 0]);

  const screenshotWidth = isVertical
    ? width * 0.9
    : isSquare
      ? width * 0.85
      : width * 0.7;

  return (
    <AbsoluteFill
      style={{
        background: BRAND.gradients.background,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: (isVertical ? 30 : 20) * s,
        padding: (isVertical ? 40 : 60) * s,
      }}
    >
      <GrainOverlay opacity={0.03} />

      <div
        style={{
          fontSize: (isVertical ? 28 : isSquare ? 32 : 36) * s,
          fontWeight: 400,
          color: BRAND.colors.textPrimary,
          fontFamily: 'Inter, sans-serif',
          opacity: titleOpacity,
          transform: `translateY(${titleY * s}px)`,
          textAlign: 'center',
          marginBottom: (isVertical ? 10 : 20) * s,
        }}
      >
        {title}
      </div>

      <div style={{position: 'relative'}}>
        <ScreenshotDisplay
          src="demo/dashboard.png"
          delay={0.2}
          width={screenshotWidth}
          borderRadius={16 * s}
          zoomStart={1}
          zoomEnd={1.02}
        />

        {showBadges && (
          <>
            <FeatureBadge
              text="Edge Scorecard"
              delay={0.8}
              x={(isVertical ? 20 : isSquare ? 30 : 40) * s}
              y={(isVertical ? 200 : isSquare ? 160 : 180) * s}
              scale={s}
            />
            <FeatureBadge
              text="Performance Stats"
              delay={1.0}
              x={screenshotWidth - (isVertical ? 150 : isSquare ? 160 : 180) * s}
              y={(isVertical ? 280 : isSquare ? 230 : 250) * s}
              scale={s}
            />
            <FeatureBadge
              text="Recent Activity"
              delay={1.2}
              x={screenshotWidth - (isVertical ? 140 : isSquare ? 150 : 160) * s}
              y={(isVertical ? 360 : isSquare ? 300 : 320) * s}
              scale={s}
            />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
