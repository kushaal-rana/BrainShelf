import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card } from '../../components/ui';
import { useDownloadsMap, deleteDownload, type DownloadEntry } from '../../lib/downloads';
import { formatBytes } from '../../lib/format';
import { colors, space } from '../../theme/obsidian';

function DownloadRow({ fileId, entry }: { fileId: string; entry: DownloadEntry }) {
  const open = () => {
    if (entry.status === 'done') router.push({ pathname: '/player/[id]', params: { id: fileId } });
  };
  const icon =
    entry.status === 'done' ? 'play-circle' : entry.status === 'error' ? 'alert-circle' : 'cloud-download';
  const subtitle =
    entry.status === 'done'
      ? formatBytes(entry.size ?? 0)
      : entry.status === 'downloading'
        ? `Downloading… ${Math.round(entry.progress * 100)}%`
        : 'Failed — delete and try again';

  return (
    <Pressable onPress={open}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.85 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Ionicons name={icon} size={24} color={colors.gold} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body" numberOfLines={2}>
                {entry.name}
              </Text>
              <Text variant="caption" color="muted">
                {subtitle}
              </Text>
            </View>
            <Pressable onPress={() => void deleteDownload(fileId)} hitSlop={10} style={{ padding: space.xs }}>
              <Ionicons name="trash-outline" size={20} color={colors.muted} />
            </Pressable>
          </View>
        </Card>
      )}
    </Pressable>
  );
}

export default function Downloads() {
  const map = useDownloadsMap();
  const items = Object.entries(map);
  const totalSize = items.reduce((sum, [, e]) => sum + (e.size ?? 0), 0);

  return (
    <Screen>
      <View style={{ paddingTop: space.xl, gap: space.xs }}>
        <Text variant="label" color="gold">
          OFFLINE
        </Text>
        <Text variant="title">Downloads</Text>
        {items.length > 0 ? (
          <Text variant="caption" color="muted">
            {items.length} {items.length === 1 ? 'lesson' : 'lessons'} · {formatBytes(totalSize)}
          </Text>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingBottom: space.xxl }}
        >
          <Ionicons name="cloud-download-outline" size={48} color={colors.muted} />
          <Text variant="body" color="muted" center>
            No downloads yet.{'\n'}Tap the download icon on a lesson to save it offline.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: space.lg, gap: space.md }}
        >
          {items.map(([id, entry]) => (
            <DownloadRow key={id} fileId={id} entry={entry} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
