import {Composition} from 'remotion';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EdgeTrackerVideo"
        component={() => <div>Edge Tracker Video</div>}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
