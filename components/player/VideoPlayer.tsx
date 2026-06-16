import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { AudioTrack, SubtitleTrack } from 'expo-video';
import { Modal, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Text } from '../ui';
import { PlayerControls } from './PlayerControls';
import { SettingsSheet } from './SettingsSheet';
import { radius, space } from '../../theme/obsidian';
import { getAccessToken } from '../../lib/auth';
import { getProgress, saveProgress } from '../../lib/progress';

const driveStreamUrl = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
const HIDE_MS = 3000;
const SAVE_EVERY = 5; // persist progress at most every N seconds of playback

const mmss = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

type VideoPlayerProps = {
  fileId: string;
  token?: string;
  localUri?: string;
};

/**
 * Phase 1 player — proven streaming core (expo-video + Bearer + progressive) under a custom
 * premium overlay: scrubber, settings (speed/audio/subs), tap-to-toggle + auto-hide,
 * double-tap seek, hold-to-2×, and landscape fullscreen.
 */
export function VideoPlayer({ fileId, token, localUri }: VideoPlayerProps) {
  const source = localUri
    ? { uri: localUri }
    : {
        uri: driveStreamUrl(fileId),
        headers: { Authorization: `Bearer ${token ?? ''}` },
        contentType: 'progressive' as const,
      };
  const player = useVideoPlayer(source, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.preservesPitch = true; // keep natural pitch at 2× / non-1× speeds (no chipmunk voice)
    p.staysActiveInBackground = true; // keep audio playing when the app is backgrounded
    p.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status, error: undefined });
  const { currentTime, bufferedPosition } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });
  const duration = player.duration;

  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hold2x, setHold2x] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [surfaceW, setSurfaceW] = useState(0);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [currentAudio, setCurrentAudio] = useState<AudioTrack | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleTrack | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [resumedAt, setResumedAt] = useState<number | null>(null);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRate = useRef(1);
  const recoveringRef = useRef(false);
  const retriesRef = useRef(0);
  const lastPositionRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const didResumeRef = useRef(false);
  const lastSavedRef = useRef(0);
  const durationRef = useRef(0);

  // Resume target captured once: skip if barely started or basically finished.
  const resumeTargetRef = useRef<number | null | undefined>(undefined);
  if (resumeTargetRef.current === undefined) {
    const saved = getProgress(fileId);
    resumeTargetRef.current =
      saved && saved.position > 5 && (saved.duration === 0 || saved.position < saved.duration - 10)
        ? saved.position
        : null;
  }

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleAutoHide = useCallback(() => {
    clearHide();
    if (isPlaying && !settingsOpen) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), HIDE_MS);
    }
  }, [clearHide, isPlaying, settingsOpen]);

  // Populate track lists once the media is ready; also reset the recovery budget and apply any
  // pending resume seek (after a token refresh + source swap).
  useEffect(() => {
    if (status === 'readyToPlay') {
      retriesRef.current = 0;
      if (!didResumeRef.current) {
        didResumeRef.current = true;
        if (resumeTargetRef.current != null) {
          player.currentTime = resumeTargetRef.current;
          setResumedAt(resumeTargetRef.current);
          setTimeout(() => setResumedAt(null), 3000);
        }
      }
      if (pendingSeekRef.current != null) {
        player.currentTime = pendingSeekRef.current;
        pendingSeekRef.current = null;
        player.play();
      }
      setAudioTracks(player.availableAudioTracks ?? []);
      setCurrentAudio(player.audioTrack ?? null);
      setSubtitleTracks(player.availableSubtitleTracks ?? []);
      setCurrentSubtitle(player.subtitleTrack ?? null);
    }
  }, [status, player]);

  // Remember the latest position (for mid-stream recovery) + persist progress throttled to ~5s.
  useEffect(() => {
    if (currentTime > 0) lastPositionRef.current = currentTime;
    if (duration > 0) durationRef.current = duration;
    if (duration > 0 && Math.abs(currentTime - lastSavedRef.current) >= SAVE_EVERY) {
      lastSavedRef.current = currentTime;
      saveProgress(fileId, currentTime, duration);
    }
  }, [currentTime, duration, fileId]);

  // Persist the final position when leaving the player.
  useEffect(
    () => () => {
      if (durationRef.current > 0) saveProgress(fileId, lastPositionRef.current, durationRef.current);
    },
    [fileId]
  );

  // Mid-stream token recovery: a Drive token can expire during a long video → the next range
  // request 401s and the player goes to 'error'. Silently fetch a fresh token, swap the source,
  // and resume at the last position. Capped at 2 rapid tries (reset on readyToPlay) so a genuine
  // network/codec error can't loop.
  useEffect(() => {
    if (localUri || status !== 'error' || recoveringRef.current || retriesRef.current >= 2) return;
    recoveringRef.current = true;
    retriesRef.current += 1;
    pendingSeekRef.current = lastPositionRef.current || null;
    setRecovering(true);
    getAccessToken()
      .then((fresh) => {
        player.replace({
          uri: driveStreamUrl(fileId),
          headers: { Authorization: `Bearer ${fresh}` },
          contentType: 'progressive',
        });
      })
      .catch(() => {
        pendingSeekRef.current = null; // refresh failed — leave the error visible
      })
      .finally(() => {
        recoveringRef.current = false;
        setRecovering(false);
      });
  }, [status, player, fileId, localUri]);

  // Reveal controls on play-state / settings change; auto-hide while playing.
  useEffect(() => {
    setControlsVisible(true);
    scheduleAutoHide();
    return clearHide;
  }, [scheduleAutoHide, clearHide]);

  // Restore portrait if we leave the player while in fullscreen.
  useEffect(
    () => () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    },
    []
  );

  const bump = useCallback(() => {
    setControlsVisible(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      clearHide();
      setControlsVisible(false);
    } else {
      setControlsVisible(true);
      scheduleAutoHide();
    }
  }, [controlsVisible, clearHide, scheduleAutoHide]);

  const doubleSeek = useCallback(
    (dir: number) => {
      bump();
      player.seekBy(dir);
    },
    [bump, player]
  );
  const start2x = useCallback(() => {
    prevRate.current = player.playbackRate;
    player.playbackRate = 2;
    setHold2x(true);
  }, [player]);
  const stop2x = useCallback(() => {
    player.playbackRate = prevRate.current;
    setHold2x(false);
  }, [player]);

  // Memoized so the high-frequency timeUpdate re-render doesn't rebuild gestures every tick.
  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => {
      runOnJS(toggleControls)();
    });
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((e) => {
        const dir = e.x < surfaceW / 2 ? -10 : 10;
        runOnJS(doubleSeek)(dir);
      });
    const longPress = Gesture.LongPress()
      .minDuration(250)
      .onStart(() => runOnJS(start2x)())
      .onEnd(() => runOnJS(stop2x)());
    return Gesture.Race(longPress, Gesture.Exclusive(doubleTap, tap));
  }, [toggleControls, doubleSeek, start2x, stop2x, surfaceW]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!fullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setFullscreen(true);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setFullscreen(false);
      }
    } catch {
      // ignore orientation errors
    }
  }, [fullscreen]);

  const selectSpeed = useCallback(
    (s: number) => {
      player.playbackRate = s;
      prevRate.current = s;
      setSpeed(s);
    },
    [player]
  );
  const selectAudio = useCallback(
    (t: AudioTrack) => {
      player.audioTrack = t;
      setCurrentAudio(t);
    },
    [player]
  );
  const selectSubtitle = useCallback(
    (t: SubtitleTrack | null) => {
      player.subtitleTrack = t;
      setCurrentSubtitle(t);
    },
    [player]
  );

  const openSettings = useCallback(() => {
    clearHide();
    setControlsVisible(true);
    setSettingsOpen(true);
  }, [clearHide]);
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    bump();
  }, [bump]);

  const surface = (
    <View style={{ flex: 1 }} onLayout={(e) => setSurfaceW(e.nativeEvent.layout.width)}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={false}
        contentFit="contain"
        allowsPictureInPicture
        startsPictureInPictureAutomatically
      />
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
      <PlayerControls
        visible={controlsVisible}
        isPlaying={isPlaying}
        loading={status === 'loading'}
        currentTime={currentTime}
        duration={duration}
        bufferedPosition={bufferedPosition}
        isFullscreen={fullscreen}
        onPlayPause={() => (isPlaying ? player.pause() : player.play())}
        onSeekBy={(s) => player.seekBy(s)}
        onSeekTo={(t) => {
          player.currentTime = t;
        }}
        onOpenSettings={openSettings}
        onToggleFullscreen={toggleFullscreen}
        onInteract={bump}
      />
      {hold2x ? (
        <View style={{ position: 'absolute', top: space.lg, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
              borderRadius: radius.pill,
            }}
          >
            <Text variant="label" color="gold">
              2× speed
            </Text>
          </View>
        </View>
      ) : null}
      {resumedAt != null ? (
        <View style={{ position: 'absolute', top: space.lg, left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
              borderRadius: radius.pill,
            }}
          >
            <Text variant="label" color="gold">
              Resumed at {mmss(resumedAt)}
            </Text>
          </View>
        </View>
      ) : null}
      <SettingsSheet
        visible={settingsOpen}
        onClose={closeSettings}
        speed={speed}
        onSelectSpeed={selectSpeed}
        audioTracks={audioTracks}
        currentAudio={currentAudio}
        onSelectAudio={selectAudio}
        subtitleTracks={subtitleTracks}
        currentSubtitle={currentSubtitle}
        onSelectSubtitle={selectSubtitle}
      />
    </View>
  );

  if (fullscreen) {
    return (
      <Modal
        visible
        animationType="fade"
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
        onRequestClose={toggleFullscreen}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>{surface}</GestureHandlerRootView>
      </Modal>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <View
        style={{
          width: '100%',
          aspectRatio: 16 / 9,
          backgroundColor: '#000',
          borderRadius: radius.lg,
          overflow: 'hidden',
        }}
      >
        {surface}
      </View>

      {recovering ? (
        <Text variant="caption" color="gold" center>
          Reconnecting…
        </Text>
      ) : error ? (
        <Text variant="caption" color="danger" center>
          {`Error: ${String(error?.message ?? error)}`}
        </Text>
      ) : null}
    </View>
  );
}
