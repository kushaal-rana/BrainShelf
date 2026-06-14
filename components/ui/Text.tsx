import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from 'react-native';
import { colors, text as textScale } from '../../theme/obsidian';

type Variant = keyof typeof textScale;

type TextProps = RNTextProps & {
  variant?: Variant;
  /** A theme color key (e.g. 'gold', 'muted') or any raw color string. */
  color?: keyof typeof colors | (string & {});
  center?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Themed text. Picks family/size/spacing from the Obsidian type scale. */
export function Text({ variant = 'body', color = 'text', center, style, children, ...rest }: TextProps) {
  const t = textScale[variant];
  const palette = colors as Record<string, string>;
  const resolvedColor = palette[color as string] ?? (color as string);

  return (
    <RNText
      style={[
        {
          color: resolvedColor,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontFamily: t.family,
          letterSpacing: t.letterSpacing,
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
