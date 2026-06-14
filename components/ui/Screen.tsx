import { ReactNode } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, space } from '../../theme/obsidian';

type ScreenProps = {
  children: ReactNode;
  /** Horizontal screen padding. */
  padded?: boolean;
  /** Safe-area edges to inset. Tab screens omit 'bottom' (the tab bar owns it). */
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
};

/** Dark, safe-area-aware page wrapper. The base of every screen. */
export function Screen({
  children,
  padded = true,
  edges = ['top', 'left', 'right'],
  style,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[{ flex: 1, paddingHorizontal: padded ? space.lg : 0 }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}
