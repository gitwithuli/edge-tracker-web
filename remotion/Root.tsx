import {Composition, Folder} from 'remotion';
import {DemoVideo, DemoVideoProps} from './compositions/DemoVideo';

const FPS = 30;

const FORMATS = {
  vertical: {width: 1080, height: 1920, name: 'Vertical-TikTok-Reels-Shorts'},
  horizontal: {width: 1920, height: 1080, name: 'Horizontal-YouTube-Twitter-LinkedIn'},
  square: {width: 2160, height: 2160, name: 'Square-Instagram-Twitter-2K'},
} as const;

const DURATIONS = {
  quick: {seconds: 9, name: '30s-Quick-Teaser', variant: 'quick' as const},
  standard: {seconds: 19, name: '45s-Standard-Demo', variant: 'standard' as const},
  full: {seconds: 28, name: '60s-Full-Walkthrough', variant: 'full' as const},
} as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Vertical-9x16-TikTok-Reels-Shorts">
        {Object.entries(DURATIONS).map(([key, duration]) => (
          <Composition
            key={`vertical-${key}`}
            id={`Demo-${FORMATS.vertical.name}-${duration.name}`}
            component={DemoVideo}
            durationInFrames={duration.seconds * FPS}
            fps={FPS}
            width={FORMATS.vertical.width}
            height={FORMATS.vertical.height}
            defaultProps={{variant: duration.variant} satisfies DemoVideoProps}
          />
        ))}
      </Folder>

      <Folder name="Horizontal-16x9-YouTube-Twitter-LinkedIn">
        {Object.entries(DURATIONS).map(([key, duration]) => (
          <Composition
            key={`horizontal-${key}`}
            id={`Demo-${FORMATS.horizontal.name}-${duration.name}`}
            component={DemoVideo}
            durationInFrames={duration.seconds * FPS}
            fps={FPS}
            width={FORMATS.horizontal.width}
            height={FORMATS.horizontal.height}
            defaultProps={{variant: duration.variant} satisfies DemoVideoProps}
          />
        ))}
      </Folder>

      <Folder name="Square-1x1-Instagram-Twitter">
        {Object.entries(DURATIONS).map(([key, duration]) => (
          <Composition
            key={`square-${key}`}
            id={`Demo-${FORMATS.square.name}-${duration.name}`}
            component={DemoVideo}
            durationInFrames={duration.seconds * FPS}
            fps={FPS}
            width={FORMATS.square.width}
            height={FORMATS.square.height}
            defaultProps={{variant: duration.variant} satisfies DemoVideoProps}
          />
        ))}
      </Folder>
    </>
  );
};
