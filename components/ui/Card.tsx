import { ReactNode } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { colors, radius, space } from '../../theme/obsidian';

type CardProps = {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Surface container with hairline border and rounded corners. */
export function Card({ children, padded = true, elevated = false, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? colors.elevated : colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.hairline,
          padding: padded ? space.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
