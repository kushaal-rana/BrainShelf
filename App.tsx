import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';

// ──────────────────────────────────────────────────────────────────────────
//  M1 SPIKE CONFIG  —  paste your own two values here, then reload the app.
//
//  1) ACCESS_TOKEN  (valid ~1 hour — throwaway, just to prove streaming works)
//     • Go to https://developers.google.com/oauthplayground
//     • In the left "Step 1" box, scroll to "Drive API v3" and tick the scope:
//          https://www.googleapis.com/auth/drive.readonly
//     • Click "Authorize APIs" → sign in with the Google account that has your
//       courses → then click "Exchange authorization code for tokens".
//     • Copy the "Access token" value and paste it below.
//
//  2) FILE_ID  (one course video to test with)
//     • Open the video in Google Drive in your browser. The URL looks like:
//          https://drive.google.com/file/d/THE_FILE_ID/view
//     • Copy the part between  /d/  and  /view  and paste it below.
// ──────────────────────────────────────────────────────────────────────────
const ACCESS_TOKEN = 'PASTE_ACCESS_TOKEN_HERE';
const FILE_ID = '1PRXn3LY6IXj0EEF8_b9QeRPz7M7LM4CD';

// Google Drive "download original bytes" endpoint. It honours HTTP Range
// requests, which is what lets the player start fast and seek smoothly.
const STREAM_URL = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`;

const SPEEDS = [1, 1.5, 2] as const;
const NEEDS_CONFIG = ACCESS_TOKEN.startsWith('PASTE') || FILE_ID.startsWith('PASTE');

export default function App() {
  const [speedIndex, setSpeedIndex] = useState(0);

  const player = useVideoPlayer(
    { uri: STREAM_URL, headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }, contentType: 'progressive' },
    (p) => {
      p.play();
    }
  );

  // Live player state — drives the Play/Pause label and a debug status line.
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
    error: undefined,
  });

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    player.playbackRate = SPEEDS[next];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>BrainShelf · M1 player spike</Text>

      <VideoView
        style={styles.video}
        player={player}
        allowsPictureInPicture
        contentFit="contain"
      />

      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => player.seekBy(-10)}>
          <Text style={styles.btnText}>⏪ 10s</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() => (isPlaying ? player.pause() : player.play())}
        >
          <Text style={styles.btnText}>{isPlaying ? '⏸ Pause' : '▶ Play'}</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => player.seekBy(10)}>
          <Text style={styles.btnText}>10s ⏩</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={cycleSpeed}>
          <Text style={styles.btnText}>{SPEEDS[speedIndex]}× speed</Text>
        </Pressable>
      </View>

      <Text style={styles.status}>status: {status}</Text>
      {error ? (
        <Text style={styles.error}>error: {String(error?.message ?? error)}</Text>
      ) : null}

      {NEEDS_CONFIG ? (
        <Text style={styles.warn}>
          ⚠️  Paste your ACCESS_TOKEN and FILE_ID at the top of App.tsx, then reload.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    paddingTop: 64,
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  btn: {
    backgroundColor: '#23232b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  status: {
    color: '#8a8a94',
    textAlign: 'center',
    fontSize: 13,
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    fontSize: 13,
  },
  warn: {
    color: '#ffd166',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
});
