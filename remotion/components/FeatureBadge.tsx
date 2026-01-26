import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';

type FeatureBadgeProps = {
  text: string;
  delay?: number;
  x: number;
  y: number;
  bgColor?: string;
  textColor?: string;
  scale?: number;
};

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  text,
  delay = 0,
  x,
  y,
  bgColor = `${BRAND.colors.gold}E6`,
  textColor = '#0a1512',
  scale: sizeScale = 1,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - delay * fps;

  const entrance = spring({
    frame: localFrame,
    fps,
    config: {damping: 15, stiffness: 200},
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const animScale = interpolate(entrance, [0, 1], [0.5, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity,
        transform: `scale(${animScale})`,
        backgroundColor: bgColor,
        color: textColor,
        padding: `${8 * sizeScale}px ${16 * sizeScale}px`,
        borderRadius: 20 * sizeScale,
        fontSize: 14 * sizeScale,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        boxShadow: `0 ${4 * sizeScale}px ${12 * sizeScale}px rgba(0, 0, 0, 0.4)`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};
