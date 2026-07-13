/**
 * Design tokens for WeeWoo² Wheel.
 * Single source of truth for all colors, spacing, and transitions.
 * Every component imports from here instead of hardcoding hex values.
 */
export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  danger: string;
  dangerBg: string;
  success: string;
  radius: string;
  radiusLg: string;
  shadow: string;
  fontFamily: string;
}

export const DARK: ThemeTokens = {
  bg: '#0e0e14',
  surface: '#1a1a24',
  surfaceHover: '#22222e',
  border: 'rgba(255,255,255,0.06)',
  text: '#e0e0e0',
  textSecondary: '#bbb',
  textMuted: '#666',
  accent: '#7aafff',
  accentBg: 'rgba(100,140,255,0.08)',
  danger: '#ff6666',
  dangerBg: 'rgba(255,60,60,0.15)',
  success: '#6a6',
  radius: '8px',
  radiusLg: '12px',
  shadow: '0 2px 8px rgba(0,0,0,0.3)',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export const LIGHT: ThemeTokens = {
  bg: '#f5f5f7',
  surface: '#ffffff',
  surfaceHover: '#f0f0f3',
  border: 'rgba(0,0,0,0.08)',
  text: '#111111',
  textSecondary: '#333333',
  textMuted: '#666565',
  accent: '#325da8',
  accentBg: 'rgba(50,100,200,0.06)',
  danger: '#cc2222',
  dangerBg: 'rgba(200,50,50,0.08)',
  success: '#2a2',
  radius: '8px',
  radiusLg: '12px',
  shadow: '0 2px 8px rgba(0,0,0,0.08)',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export function t(isDark: boolean): ThemeTokens {
  return isDark ? DARK : LIGHT;
}
