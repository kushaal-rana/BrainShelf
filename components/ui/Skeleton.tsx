import { MotiView } from 'moti';
import { StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { colors, radius as radii } from '../../theme/obsidian';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Shimmering placeholder block (opacity pulse via moti/Reanimated). */
export function Skeleton({ width = '100%', height = 16, radius = radii.sm, style }: SkeletonProps) {
  return (
    <MotiView
      from={{ opacity: 0.35 }}
      animate={{ opacity: 0.7 }}
      transition={{ loop: true, type: 'timing', duration: 900 }}
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.elevated }, style]}
    />
  );
}
