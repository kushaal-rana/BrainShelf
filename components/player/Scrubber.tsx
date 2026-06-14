import { useEffect } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { colors, radius } from '../../theme/obsidian';

type ScrubberProps = {
  currentTime: number;
  duration: number;
  bufferedPosition?: number;
  /** Live scrub position while dragging (seconds), or null on release. */
  onScrub?: (time: number | null) => void;
  /** Final seek target on release (seconds). */
  onSeek: (time: number) => void;
};

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 16;
const HIT_SLOP = 14;

function clampWorklet(v: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(v, min), max);
}

/** Gold draggable progress bar — drag the thumb or tap the track to seek. */
export function Scrubber({ currentTime, duration, bufferedPosition = 0, onScrub, onSeek }: ScrubberProps) {
  const trackW = useSharedValue(0);
  const progress = useSharedValue(0); // 0..1
  const scrubbing = useSharedValue(false);

  // Follow playback when the user isn't dragging.
  useEffect(() => {
    if (!scrubbing.value && duration > 0) {
      progress.value = Math.min(Math.max(currentTime / duration, 0), 1);
    }
  }, [currentTime, duration, progress, scrubbing]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      scrubbing.value = true;
      progress.value = trackW.value > 0 ? clampWorklet(e.x / trackW.value, 0, 1) : 0;
      if (onScrub) runOnJS(onScrub)(progress.value * duration);
    })
    .onUpdate((e) => {
      progress.value = trackW.value > 0 ? clampWorklet(e.x / trackW.value, 0, 1) : 0;
      if (onScrub) runOnJS(onScrub)(progress.value * duration);
    })
    .onEnd(() => {
      runOnJS(onSeek)(progress.value * duration);
    })
    .onFinalize(() => {
      scrubbing.value = false;
      if (onScrub) runOnJS(onScrub)(null);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * trackW.value }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * trackW.value - THUMB_SIZE / 2 }],
  }));

  const bufferedFrac = duration > 0 && bufferedPosition > 0 ? Math.min(bufferedPosition / duration, 1) : 0;

  const onLayout = (e: LayoutChangeEvent) => {
    trackW.value = e.nativeEvent.layout.width;
  };

  return (
    <GestureDetector gesture={pan}>
      <View style={{ height: THUMB_SIZE + HIT_SLOP * 2, justifyContent: 'center' }}>
        {/* track */}
        <View
          onLayout={onLayout}
          style={{ height: TRACK_HEIGHT, borderRadius: radius.pill, backgroundColor: colors.hairline, overflow: 'hidden' }}
        >
          {/* buffered underlay */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${bufferedFrac * 100}%`,
              backgroundColor: colors.muted,
              opacity: 0.4,
            }}
          />
          {/* gold fill */}
          <Animated.View
            style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.gold }, fillStyle]}
          />
        </View>
        {/* thumb */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: '50%',
              marginTop: -(THUMB_SIZE / 2),
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: colors.gold,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
