import { ComponentProps, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Text } from '../ui';
import { Scrubber } from './Scrubber';
import { colors, space } from '../../theme/obsidian';

type IconName = ComponentProps<typeof Ionicons>['name'];

type PlayerControlsProps = {
  visible: boolean;
  isPlaying: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  bufferedPosition: number;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeekBy: (seconds: number) => void;
  onSeekTo: (time: number) => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  onInteract: () => void;
};

function fmt(s: number, forceHours: boolean) {
  const total = !isFinite(s) || s < 0 ? 0 : Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, '0');
  return h > 0 || forceHours ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Premium overlay — auto-hides via the `visible` prop (managed by VideoPlayer). */
export function PlayerControls({
  visible,
  isPlaying,
  loading,
  currentTime,
  duration,
  bufferedPosition,
  isFullscreen,
  onPlayPause,
  onSeekBy,
  onSeekTo,
  onOpenSettings,
  onToggleFullscreen,
  onInteract,
}: PlayerControlsProps) {
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const shownTime = scrubTime ?? currentTime;
  const forceHours = duration >= 3600;

  return (
    <MotiView
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ type: 'timing', duration: 200 }}
      style={[StyleSheet.absoluteFill, { pointerEvents: visible ? 'box-none' : 'none' }]}
    >
      {/* top row: settings + fullscreen */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: space.sm,
          padding: space.md,
          pointerEvents: 'box-none',
        }}
      >
        <CircleButton
          icon="settings-outline"
          size={40}
          iconSize={20}
          hitSlop={8}
          onPress={() => { onInteract(); onOpenSettings(); }}
        />
        <CircleButton
          icon={isFullscreen ? 'contract-outline' : 'expand-outline'}
          size={40}
          iconSize={20}
          hitSlop={8}
          onPress={() => { onInteract(); onToggleFullscreen(); }}
        />
      </View>

      {/* center transport */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.xxl,
          pointerEvents: 'box-none',
        }}
      >
        <CircleButton icon="play-back" onPress={() => { onInteract(); onSeekBy(-10); }} />
        {loading ? (
          <ActivityIndicator color={colors.gold} size="large" />
        ) : (
          <CircleButton
            icon={isPlaying ? 'pause' : 'play'}
            size={64}
            iconSize={32}
            onPress={() => { onInteract(); onPlayPause(); }}
          />
        )}
        <CircleButton icon="play-forward" onPress={() => { onInteract(); onSeekBy(10); }} />
      </View>

      {/* bottom bar */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)'] as const}
        style={{ paddingHorizontal: space.lg, paddingTop: space.xxl, paddingBottom: space.md, pointerEvents: 'box-none' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, pointerEvents: 'box-none' }}>
          <Text variant="mono" color="text">
            {fmt(shownTime, forceHours)}
          </Text>
          <View style={{ flex: 1 }}>
            <Scrubber
              currentTime={currentTime}
              duration={duration}
              bufferedPosition={bufferedPosition}
              onScrub={(t) => {
                onInteract();
                setScrubTime(t);
              }}
              onSeek={(t) => {
                setScrubTime(null);
                onSeekTo(t);
              }}
            />
          </View>
          <Text variant="mono" color="muted">
            {fmt(duration, forceHours)}
          </Text>
        </View>
      </LinearGradient>
    </MotiView>
  );
}

/** Circular translucent control button (sized via props). */
function CircleButton({
  icon,
  onPress,
  size = 48,
  iconSize = 22,
  hitSlop,
}: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  hitSlop?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={iconSize} color={colors.text} />
    </Pressable>
  );
}
