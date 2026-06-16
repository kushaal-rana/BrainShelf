// components/FolderView.tsx — the reusable adaptive Drive browser: subfolders (tap → deeper) +
// videos (tap → play), with pull-to-refresh. Powers the Library root and every folder/[id] screen.
import { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text, Card, Skeleton, ProgressRing } from './ui';
import { useDriveFolder, type DriveItem } from '../lib/drive';
import { formatBytes } from '../lib/format';
import { usePinnedFolders, togglePin } from '../lib/pinnedFolders';
import { useLessonProgress } from '../lib/progress';
import { useDownload, startDownload } from '../lib/downloads';
import { colors, radius, space } from '../theme/obsidian';

function LessonStatus({ fileId }: { fileId: string }) {
  const progress = useLessonProgress(fileId);
  if (!progress) return null;
  if (progress.completed) {
    return <Ionicons name="checkmark-circle" size={24} color={colors.gold} />;
  }
  if (progress.duration > 0 && progress.position > 0) {
    const pct = Math.round((progress.position / progress.duration) * 100);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <ProgressRing
          progress={progress.position / progress.duration}
          size={26}
          strokeWidth={3}
          showLabel={false}
        />
        <Text variant="caption" color="muted">
          {pct}%
        </Text>
      </View>
    );
  }
  return null;
}

function DownloadButton({ fileId, name, size }: { fileId: string; name: string; size?: number }) {
  const dl = useDownload(fileId);

  const confirmDownload = () => {
    void Haptics.selectionAsync();
    const sizeLabel = size ? ` (${formatBytes(size)})` : '';
    Alert.alert('Download lesson?', `${name}${sizeLabel} will be saved for offline playback.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Download', onPress: () => void startDownload(fileId, name) },
    ]);
  };

  if (dl?.status === 'done') {
    return <Ionicons name="checkmark-done-circle" size={22} color={colors.gold} />;
  }
  if (dl?.status === 'downloading') {
    return (
      <Text variant="caption" color="gold">
        {Math.round(dl.progress * 100)}%
      </Text>
    );
  }
  return (
    <Pressable onPress={confirmDownload} hitSlop={10} style={{ padding: space.xs }}>
      <Ionicons
        name={dl?.status === 'error' ? 'alert-circle-outline' : 'download-outline'}
        size={20}
        color={dl?.status === 'error' ? colors.danger : colors.muted}
      />
    </Pressable>
  );
}

function Item({ item, onPress }: { item: DriveItem; onPress: () => void }) {
  const { pinned } = usePinnedFolders();
  const isPinned = pinned.some((p) => p.id === item.id);

  const onToggle = () => {
    void Haptics.selectionAsync();
    togglePin({ id: item.id, name: item.name });
  };

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.85 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.md,
                backgroundColor: colors.elevated,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={item.isFolder ? 'folder' : 'play'} size={20} color={colors.gold} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body" numberOfLines={2}>
                {item.name}
              </Text>
              {!item.isFolder && item.size ? (
                <Text variant="caption" color="muted">
                  {formatBytes(item.size)}
                </Text>
              ) : null}
            </View>
            {item.isFolder ? (
              <>
                <Pressable onPress={onToggle} hitSlop={10} style={{ padding: space.xs }}>
                  <Ionicons
                    name={isPinned ? 'star' : 'star-outline'}
                    size={20}
                    color={isPinned ? colors.gold : colors.muted}
                  />
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </>
            ) : (
              <>
                <LessonStatus fileId={item.id} />
                <DownloadButton fileId={item.id} name={item.name} size={item.size} />
              </>
            )}
          </View>
        </Card>
      )}
    </Pressable>
  );
}

export function FolderView({ folderId }: { folderId: string }) {
  const { data, loading, error, refresh } = useDriveFolder(folderId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <View style={{ gap: space.md, paddingTop: space.lg }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Skeleton width={44} height={44} radius={radius.md} />
              <Skeleton width="60%" height={16} />
            </View>
          </Card>
        ))}
      </View>
    );
  }

  const folders = data?.folders ?? [];
  const videos = data?.videos ?? [];
  const isEmpty = !error && folders.length === 0 && videos.length === 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: space.lg, gap: space.md }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
      }
    >
      {error ? (
        <Card style={{ gap: space.xs }}>
          <Text variant="body" color="danger" center>
            {error}
          </Text>
          <Text variant="caption" color="muted" center>
            Pull down to retry.
          </Text>
        </Card>
      ) : null}

      {folders.map((f) => (
        <Item
          key={f.id}
          item={f}
          onPress={() => router.push({ pathname: '/folder/[id]', params: { id: f.id, name: f.name } })}
        />
      ))}
      {videos.map((v) => (
        <Item
          key={v.id}
          item={v}
          onPress={() => router.push({ pathname: '/player/[id]', params: { id: v.id } })}
        />
      ))}

      {isEmpty ? (
        <Card>
          <Text variant="body" color="muted" center>
            Nothing to show here yet.
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
