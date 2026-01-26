import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

type ScreenshotDisplayProps = {
  src: string;
  delay?: number;
  width?: number;
  height?: number;
  borderRadius?: number;
  shadow?: boolean;
  zoomStart?: number;
  zoomEnd?: number;
  panX?: number;
  panY?: number;
};

export const ScreenshotDisplay: React.FC<ScreenshotDisplayProps> = ({
  src,
  delay = 0,
  width,
  height,
  borderRadius = 12,
  shadow = true,
  zoomStart = 1,
  zoomEnd = 1.05,
  panX = 0,
  panY = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const localFrame = frame - delay * fps;

  const entrance = spring({
    frame: localFrame,
    fps,
    config: {damping: 200},
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scale = interpolate(entrance, [0, 1], [0.9, 1]);

  const zoomProgress = interpolate(localFrame, [0, durationInFrames - delay * fps], [zoomStart, zoomEnd], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateX = interpolate(localFrame, [0, durationInFrames - delay * fps], [0, panX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(localFrame, [0, durationInFrames - delay * fps], [0, panY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        overflow: 'hidden',
        borderRadius,
        ...(shadow && {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }),
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: width || 'auto',
          height: height || 'auto',
          transform: `scale(${zoomProgress}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
};
