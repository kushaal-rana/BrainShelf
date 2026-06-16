import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, space, motion } from '../../theme/obsidian';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Tactile button: scale-0.97 spring on press + light haptic. */
export function Button({ label, onPress, variant = 'primary', disabled, icon, style }: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'primary' ? colors.gold : variant === 'secondary' ? colors.elevated : 'transparent';
  const fg = variant === 'primary' ? colors.bg : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(motion.pressScale, motion.spring);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.spring);
      }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            backgroundColor: bg,
            borderColor: colors.hairline,
            borderWidth: variant === 'ghost' ? 1 : 0,
            borderRadius: radius.md,
            paddingVertical: space.md,
            paddingHorizontal: space.xl,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.sm,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {icon}
        <Text variant="subtitle" numberOfLines={1} style={{ color: fg }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
