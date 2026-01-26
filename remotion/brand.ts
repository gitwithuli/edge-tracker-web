export const BRAND = {
  colors: {
    background: '#0f1f1a',
    backgroundGradientStart: '#0a1512',
    backgroundGradientEnd: '#142822',
    gold: '#C9A962',
    goldLight: '#D4C48A',
    goldDark: '#A68B4B',
    green: '#2D5A47',
    greenLight: '#3D7A5F',
    greenDark: '#1a3a2f',
    textPrimary: '#FFFFFF',
    textSecondary: '#8B9A87',
    textMuted: '#5A6B58',
    accent: '#C9A962',
  },
  gradients: {
    background: 'linear-gradient(180deg, #0a1512 0%, #142822 100%)',
    backgroundRadial: 'radial-gradient(ellipse at center, #1a3a2f 0%, #0a1512 100%)',
  },
} as const;

const BASE_WIDTH = 1080;
export const getScale = (width: number): number => width / BASE_WIDTH;
