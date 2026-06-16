// components/PinnedRail.tsx — a horizontal rail of pinned folders shown atop the Library.
// Tap a card to jump straight into that folder; long-press to unpin. Self-hides when empty.
import { ScrollView, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from './ui';
import { usePinnedFolders, togglePin, type PinnedFolder } from '../lib/pinnedFolders';
import { colors, radius, space } from '../theme/obsidian';

const CARD_WIDTH = 160;
const CARD_HEIGHT = 104;

function PinnedCard({ folder }: { folder: PinnedFolder }) {
  const open = () =>
    router.push({ pathname: '/folder/[id]', params: { id: folder.id, name: folder.name } });
  const unpin = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePin(folder);
  };

  return (
    <Pressable onPress={open} onLongPress={unpin} delayLongPress={300}>
      {({ pressed }) => (
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            padding: space.md,
            justifyContent: 'space-between',
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Ionicons name="folder" size={20} color={colors.gold} />
            <Ionicons name="star" size={14} color={colors.gold} />
          </View>
          <Text variant="body" numberOfLines={2}>
            {folder.name}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function PinnedRail() {
  const { pinned } = usePinnedFolders();
  if (pinned.length === 0) return null;

  return (
    <View style={{ gap: space.sm, paddingTop: space.lg }}>
      <Text variant="label" color="gold">
        PINNED
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: CARD_HEIGHT }}
        contentContainerStyle={{ gap: space.md, paddingRight: space.md }}
      >
        {pinned.map((folder) => (
          <PinnedCard key={folder.id} folder={folder} />
        ))}
      </ScrollView>
    </View>
  );
}
