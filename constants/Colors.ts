const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const SCREEN_TOP_PADDING = 60;

export const AppColors = {
  background: '#F7F9FC',
  surface: '#FFFFFF',
  brand: '#243B55',
  accent: '#4A90D9',
  accentLight: '#EEF5FF',
  text: '#1A2332',
  textSub: '#6B7A8D',
  border: '#E4EAF1',
  chip: '#EEF3FA',
  teal: '#38B2AC',
  danger: '#E53E3E',
  yellow: '#FACC15',
} as const;
