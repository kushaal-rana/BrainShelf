import { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AudioTrack, SubtitleTrack } from 'expo-video';
import { Text } from '../ui';
import { colors, radius, space } from '../../theme/obsidian';

const SPEEDS = [0.5, 1, 1.25, 1.5, 1.75, 2];
type SettingsView = 'root' | 'speed' | 'audio' | 'subtitles';

type SettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  speed: number;
  onSelectSpeed: (s: number) => void;
  audioTracks: AudioTrack[];
  currentAudio: AudioTrack | null;
  onSelectAudio: (t: AudioTrack) => void;
  subtitleTracks: SubtitleTrack[];
  currentSubtitle: SubtitleTrack | null;
  onSelectSubtitle: (t: SubtitleTrack | null) => void;
};

const trackKey = (t: { language: string; label: string } | null) => (t ? `${t.language}/${t.label}` : 'off');
const trackLabel = (t: { language: string; label: string }) => t.label || t.language;

/** Drill-down settings: a category list → tap one → only that category's options. */
export function SettingsSheet({
  visible,
  onClose,
  speed,
  onSelectSpeed,
  audioTracks,
  currentAudio,
  onSelectAudio,
  subtitleTracks,
  currentSubtitle,
  onSelectSubtitle,
}: SettingsSheetProps) {
  const [view, setView] = useState<SettingsView>('root');

  // Always start at the category list each time the sheet opens.
  useEffect(() => {
    if (visible) setView('root');
  }, [visible]);

  if (!visible) return null;

  const speedValue = speed === 1 ? 'Normal' : `${speed}×`;
  const audioValue = currentAudio ? trackLabel(currentAudio) : audioTracks.length ? 'Default' : 'None';
  const subtitleValue = currentSubtitle ? trackLabel(currentSubtitle) : 'Off';

  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingVertical: space.md,
          maxHeight: '80%',
        }}
      >
        {view === 'root' ? (
          <>
            <Header title="Settings" onClose={onClose} />
            <NavRow label="Playback speed" value={speedValue} onPress={() => setView('speed')} />
            <NavRow label="Audio" value={audioValue} onPress={() => setView('audio')} />
            <NavRow label="Subtitles" value={subtitleValue} onPress={() => setView('subtitles')} />
          </>
        ) : view === 'speed' ? (
          <Detail title="Playback speed" onBack={() => setView('root')}>
            {SPEEDS.map((s) => (
              <OptionRow
                key={s}
                label={s === 1 ? 'Normal' : `${s}×`}
                active={Math.abs(speed - s) < 0.001}
                onPress={() => {
                  onSelectSpeed(s);
                  setView('root');
                }}
              />
            ))}
          </Detail>
        ) : view === 'audio' ? (
          <Detail title="Audio" onBack={() => setView('root')}>
            {audioTracks.length === 0 ? (
              <Text variant="caption" color="muted" style={{ paddingHorizontal: space.lg, paddingVertical: space.sm }}>
                No alternate audio tracks.
              </Text>
            ) : (
              audioTracks.map((t) => (
                <OptionRow
                  key={trackKey(t)}
                  label={trackLabel(t)}
                  active={trackKey(t) === trackKey(currentAudio)}
                  onPress={() => {
                    onSelectAudio(t);
                    setView('root');
                  }}
                />
              ))
            )}
          </Detail>
        ) : (
          <Detail title="Subtitles" onBack={() => setView('root')}>
            <OptionRow
              label="Off"
              active={currentSubtitle === null}
              onPress={() => {
                onSelectSubtitle(null);
                setView('root');
              }}
            />
            {subtitleTracks.map((t) => (
              <OptionRow
                key={trackKey(t)}
                label={trackLabel(t)}
                active={trackKey(t) === trackKey(currentSubtitle)}
                onPress={() => {
                  onSelectSubtitle(t);
                  setView('root');
                }}
              />
            ))}
          </Detail>
        )}
      </View>
    </View>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingBottom: space.sm,
      }}
    >
      <Text variant="subtitle">{title}</Text>
      <Pressable onPress={onClose} hitSlop={8}>
        <Ionicons name="close" size={22} color={colors.muted} />
      </Pressable>
    </View>
  );
}

function Detail({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <>
      <Pressable
        onPress={onBack}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.gold} />
        <Text variant="subtitle">{title}</Text>
      </Pressable>
      <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </>
  );
}

function NavRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        gap: space.md,
      }}
    >
      <Text variant="body">{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, flexShrink: 1 }}>
        <Text variant="caption" color="muted" numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

function OptionRow({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
      }}
    >
      <Text variant="body" color={active ? 'gold' : 'text'}>
        {label}
      </Text>
      {active ? <Ionicons name="checkmark" size={20} color={colors.gold} /> : null}
    </Pressable>
  );
}
