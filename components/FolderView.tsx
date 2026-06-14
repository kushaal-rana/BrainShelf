// components/FolderView.tsx — the reusable adaptive Drive browser: subfolders (tap → deeper) +
// videos (tap → play), with pull-to-refresh. Powers the Library root and every folder/[id] screen.
import { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card, Skeleton } from './ui';
import { useDriveFolder, type DriveItem } from '../lib/drive';
import { colors, radius, space } from '../theme/obsidian';

function Item({ item, onPress }: { item: DriveItem; onPress: () => void }) {
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
            <Text variant="body" numberOfLines={2} style={{ flex: 1 }}>
              {item.name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
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
