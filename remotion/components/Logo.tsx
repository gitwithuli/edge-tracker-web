import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

type LogoProps = {
  delay?: number;
  size?: number;
  iconScale?: number;
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
};

export const Logo: React.FC<LogoProps> = ({
  delay = 0,
  size = 60,
  iconScale = 1,
  showText = true,
  layout = 'horizontal',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const localFrame = frame - delay * fps;

  const entrance = spring({
    frame: localFrame,
    fps,
    config: {damping: 200},
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scale = interpolate(entrance, [0, 1], [0.8, 1]);

  const iconSize = size * iconScale;
  const isVertical = layout === 'vertical';

  const baseGap = isVertical ? 20 : (iconScale > 1.5 ? 24 : 16);
  const textGapRatio = 6 / 60;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: baseGap * (size / 60),
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <Img
        src={staticFile('demo/logo.png')}
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: 'contain',
        }}
      />
      {showText && (
        <div style={{display: 'flex', alignItems: 'baseline', gap: size * textGapRatio}}>
          <span
            style={{
              fontSize: size * 0.45,
              fontWeight: 600,
              color: '#C9A962',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            EDGE
          </span>
          <span
            style={{
              fontSize: size * 0.3,
              fontWeight: 400,
              color: '#8B9A87',
              fontFamily: 'Inter, sans-serif',
              fontStyle: 'italic',
            }}
          >
            of
          </span>
          <span
            style={{
              fontSize: size * 0.45,
              fontWeight: 600,
              color: '#C9A962',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            ICT
          </span>
        </div>
      )}
    </div>
  );
};
