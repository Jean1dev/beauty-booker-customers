import { Platform } from 'react-native';

export const Palette = {
  rose: {
    50:  '#FDF6F4',
    100: '#F9E8E3',
    200: '#F2CDCA',
    300: '#E8A8A3',
    400: '#D97E7A',
    500: '#C45C58',
    600: '#A83D3A',
    700: '#8A2927',
    800: '#6B1C1A',
    900: '#4A1210',
  },
  gold: {
    100: '#FAF3E0',
    200: '#F0DFA8',
    300: '#E2C56A',
    400: '#C9A84C',
    500: '#A8863A',
    600: '#856729',
  },
  neutral: {
    50:  '#FAFAF9',
    100: '#F4F3F1',
    200: '#E8E6E1',
    300: '#CCC9C0',
    400: '#A09C91',
    500: '#736F65',
    600: '#504D45',
    700: '#363330',
    800: '#242220',
    900: '#141210',
  },
};

export const Colors = {
  light: {
    text: Palette.neutral[900],
    background: Palette.neutral[50],
    surface: '#FFFFFF',
    subtle: Palette.neutral[100],
    border: Palette.neutral[200],
    tint: Palette.rose[500],
    icon: Palette.neutral[400],
    tabIconDefault: Palette.neutral[400],
    tabIconSelected: Palette.rose[500],
    tabBarBackground: '#FFFFFF',
    accent: Palette.rose[500],
    accentLight: Palette.rose[100],
  },
  dark: {
    text: '#F5F2EE',
    background: Palette.neutral[900],
    surface: Palette.neutral[800],
    subtle: Palette.neutral[700],
    border: Palette.neutral[700],
    tint: Palette.rose[400],
    icon: Palette.neutral[400],
    tabIconDefault: Palette.neutral[500],
    tabIconSelected: Palette.rose[400],
    tabBarBackground: Palette.neutral[800],
    accent: Palette.rose[400],
    accentLight: 'rgba(196,92,88,0.15)',
  },
};

export const TabBarMetrics = {
  paddingTop: 8,
  ...Platform.select({
    ios: { height: 84, paddingBottom: 24 },
    default: { height: 64, paddingBottom: 8 },
  }),
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
