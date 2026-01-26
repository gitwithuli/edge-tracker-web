import {AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {IntroScene} from './scenes/IntroScene';
import {DashboardScene} from './scenes/DashboardScene';
import {EdgeDetailScene} from './scenes/EdgeDetailScene';
import {ShareFeatureScene} from './scenes/ShareFeatureScene';
import {FeaturesScene} from './scenes/FeaturesScene';
import {CTAScene} from './scenes/CTAScene';

export type DemoVideoProps = {
  variant: 'quick' | 'standard' | 'full';
};

export const DemoVideo: React.FC<DemoVideoProps> = ({variant}) => {
  const {fps, durationInFrames} = useVideoConfig();

  const transitionDuration = Math.round(0.5 * fps);
  const timing = linearTiming({durationInFrames: transitionDuration});

  const musicStartFrame = 12 * fps;
  const fadeOutStart = durationInFrames - 2 * fps;

  const backgroundMusic = (
    <Sequence from={musicStartFrame}>
      <Audio
        src={staticFile('demo/background-music.mp3')}
        volume={(f) => {
          const fadeIn = interpolate(f, [0, 1 * fps], [0, 0.4], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const fadeOut = interpolate(
            f,
            [fadeOutStart - musicStartFrame, durationInFrames - musicStartFrame],
            [0.4, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
          );
          return Math.min(fadeIn, fadeOut + 0.4, 0.4);
        }}
      />
    </Sequence>
  );

  if (variant === 'quick') {
    const introDuration = Math.round(3 * fps);
    const dashboardDuration = Math.round(4 * fps);
    const ctaDuration = Math.round(3 * fps);

    return (
      <AbsoluteFill>
        {backgroundMusic}
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={introDuration} style={{overflow: 'hidden'}}>
            <IntroScene tagline="Track the" subtitle="of your edge." />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={dashboardDuration} style={{overflow: 'hidden'}}>
            <DashboardScene title="Track Your Edge" showBadges={true} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={ctaDuration} style={{overflow: 'hidden'}}>
            <CTAScene />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>
    );
  }

  if (variant === 'standard') {
    const introDuration = Math.round(3.5 * fps);
    const dashboardDuration = Math.round(5 * fps);
    const edgeDetailDuration = Math.round(5 * fps);
    const shareDuration = Math.round(4 * fps);
    const ctaDuration = Math.round(3.5 * fps);

    return (
      <AbsoluteFill>
        {backgroundMusic}
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={introDuration} style={{overflow: 'hidden'}}>
            <IntroScene tagline="Track the" subtitle="of your edge." />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={dashboardDuration} style={{overflow: 'hidden'}}>
            <DashboardScene title="Your Trading Dashboard" showBadges={true} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={edgeDetailDuration} style={{overflow: 'hidden'}}>
            <EdgeDetailScene title="Deep Edge Analytics" showBadges={true} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={shareDuration} style={{overflow: 'hidden'}}>
            <ShareFeatureScene />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={timing} />
          <TransitionSeries.Sequence durationInFrames={ctaDuration} style={{overflow: 'hidden'}}>
            <CTAScene />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>
    );
  }

  const introDuration = Math.round(4 * fps);
  const dashboardDuration = Math.round(6 * fps);
  const edgeDetailDuration = Math.round(6 * fps);
  const featuresDuration = Math.round(6 * fps);
  const shareDuration = Math.round(5 * fps);
  const ctaDuration = Math.round(4 * fps);

  return (
    <AbsoluteFill>
      {backgroundMusic}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={introDuration} style={{overflow: 'hidden'}}>
          <IntroScene tagline="Track the" subtitle="of your edge." />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={dashboardDuration} style={{overflow: 'hidden'}}>
          <DashboardScene title="Your Trading Dashboard" showBadges={true} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={edgeDetailDuration} style={{overflow: 'hidden'}}>
          <EdgeDetailScene title="Deep Edge Analytics" showBadges={true} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={featuresDuration} style={{overflow: 'hidden'}}>
          <FeaturesScene title="Built for ICT Traders" />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={shareDuration} style={{overflow: 'hidden'}}>
          <ShareFeatureScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={timing} />
        <TransitionSeries.Sequence durationInFrames={ctaDuration} style={{overflow: 'hidden'}}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
