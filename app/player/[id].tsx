import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Button } from '../../components/ui';
import { VideoPlayer } from '../../components/player/VideoPlayer';
import { getAccessToken } from '../../lib/auth';
import { useLessonProgress, toggleComplete } from '../../lib/progress';
import { getDownload } from '../../lib/downloads';
import { colors, space } from '../../theme/obsidian';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const download = getDownload(id);
  const localUri = download?.status === 'done' ? download.localUri : undefined;
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const completed = useLessonProgress(id)?.completed ?? false;

  // Downloaded lessons play from disk (no token). Otherwise fetch a fresh Drive token to stream.
  useEffect(() => {
    if (localUri) return;
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
  }, [localUri]);

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

  if (!localUri && !token) {
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
        <VideoPlayer fileId={id} token={token ?? undefined} localUri={localUri} />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Back"
              variant="ghost"
              onPress={() => router.back()}
              style={{ paddingHorizontal: space.md }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={completed ? '✓ Completed' : 'Complete'}
              variant={completed ? 'primary' : 'secondary'}
              onPress={() => {
                void Haptics.selectionAsync();
                toggleComplete(id);
              }}
              style={{ paddingHorizontal: space.md }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
