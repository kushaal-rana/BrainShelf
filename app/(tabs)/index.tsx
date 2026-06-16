import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Text, Card, Button } from '../../components/ui';
import { FolderView } from '../../components/FolderView';
import { PinnedRail } from '../../components/PinnedRail';
import { useAuth, signIn } from '../../lib/auth';
import { useRootFolder } from '../../lib/rootFolder';
import { space } from '../../theme/obsidian';

export default function Library() {
  const { user } = useAuth();
  const { rootId, ready } = useRootFolder();

  return (
    <Screen>
      <View style={{ paddingTop: space.xl, gap: space.xs }}>
        <Text variant="label" color="gold">
          YOUR SHELF
        </Text>
        <Text variant="title">Library</Text>
      </View>

      {!user ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: space.xxl }}>
          <Card style={{ gap: space.md }}>
            <Text variant="subtitle">Connect your Google account</Text>
            <Text variant="caption" color="muted">
              Sign in to load your Drive courses.
            </Text>
            <Button label="Connect Google" onPress={() => void signIn()} />
          </Card>
        </View>
      ) : !ready ? null : !rootId ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: space.xxl }}>
          <Card style={{ gap: space.md }}>
            <Text variant="subtitle">Pick your course folder</Text>
            <Text variant="caption" color="muted">
              In Settings, paste the Drive folder that holds your courses.
            </Text>
            <Button label="Go to Settings" variant="secondary" onPress={() => router.push('/settings')} />
          </Card>
        </View>
      ) : (
        <>
          <PinnedRail />
          <FolderView folderId={rootId} />
        </>
      )}
    </Screen>
  );
}
