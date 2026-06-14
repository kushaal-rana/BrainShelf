import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button } from '../../components/ui';
import { colors, space } from '../../theme/obsidian';

export default function Downloads() {
  return (
    <Screen>
      <View style={{ paddingVertical: space.xl, gap: space.xs }}>
        <Text variant="label" color="gold">
          OFFLINE
        </Text>
        <Text variant="title">Downloads</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <Ionicons name="cloud-download-outline" size={48} color={colors.muted} />
        <Text variant="body" color="muted" center>
          No downloads yet.{'\n'}Saved lessons play without a connection.
        </Text>
        <Button label="Browse library" variant="secondary" />
      </View>
    </Screen>
  );
}
