import { router, useLocalSearchParams } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text } from '../../components/ui';
import { FolderView } from '../../components/FolderView';
import { colors, space } from '../../theme/obsidian';

export default function FolderScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.lg }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.gold} />
        </Pressable>
        <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
          {name ?? 'Folder'}
        </Text>
      </View>
      <FolderView folderId={id} />
    </Screen>
  );
}
