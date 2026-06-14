// Obsidian Vault — design tokens for BrainShelf.
// Dark + gold, premium and distraction-free. Single source of truth for the UI kit.

export const colors = {
  bg: '#050505', // app background
  surface: '#1A1A1A', // cards / sheets
  elevated: '#2A2A2A', // raised surfaces, skeletons
  gold: '#D4AF37', // primary accent
  text: '#F5F5F5', // primary text
  muted: '#A1A1AA', // secondary text
  hairline: '#27272A', // borders / dividers / ring track
  overlay: 'rgba(0,0,0,0.6)', // scrims
  danger: '#E5484D', // destructive
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Font family names match the @expo-google-fonts exports loaded in app/_layout.tsx.
export const font = {
  display: {
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
  },
  body: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
  },
  mono: 'monospace', // timecodes (Android system mono — Android-only app)
} as const;

// Type scale. `family` is a loaded fontFamily string from `font` above.
export const text = {
  hero: { fontSize: 34, lineHeight: 40, family: font.display.extrabold, letterSpacing: -0.5 },
  title: { fontSize: 26, lineHeight: 32, family: font.display.bold, letterSpacing: -0.3 },
  heading: { fontSize: 20, lineHeight: 26, family: font.display.semibold, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 24, family: font.body.semibold, letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 22, family: font.body.regular, letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 18, family: font.body.medium, letterSpacing: 1.2 },
  caption: { fontSize: 12, lineHeight: 16, family: font.body.regular, letterSpacing: 0.2 },
  mono: { fontSize: 13, lineHeight: 18, family: font.mono, letterSpacing: 0 },
} as const;

// Motion constants — tactile press + springy easing.
export const motion = {
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 220, mass: 0.6 },
  springSoft: { damping: 15, stiffness: 140, mass: 0.8 },
  duration: { fast: 150, base: 220, slow: 360 },
} as const;

export const theme = { colors, space, radius, font, text, motion } as const;
export type Theme = typeof theme;
export default theme;
