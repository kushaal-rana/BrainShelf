import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Screen, Text, Button } from '../../components/ui';
import { VideoPlayer } from '../../components/player/VideoPlayer';
import { getAccessToken } from '../../lib/auth';
import { colors, space } from '../../theme/obsidian';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetch a fresh Drive token right before playback (silently refreshed on Android).
  useEffect(() => {
    let active = true;
    getAccessToken()
      .then((t) => {
        if (active) setToken(t);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (failed) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
          <Text variant="heading" center>
            Could not get a Drive token
          </Text>
          <Text variant="body" color="muted" center>
            Make sure you are signed in to Google, then try again.
          </Text>
          <Button label="Back to Library" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.lg }}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="body" color="muted" center>
            Preparing your lesson…
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.xl }}>
        <VideoPlayer fileId={id} token={token} />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
