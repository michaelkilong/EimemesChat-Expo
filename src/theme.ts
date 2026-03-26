// theme.ts — v1.0
// Replaces all CSS variables from globals.css with typed JS theme objects.

export interface Theme {
  bg: string;
  bgA: string;
  text1: string;
  text2: string;
  text3: string;
  border: string;
  borderB: string;
  glass1: string;
  glass2: string;
  glass3: string;
  inputBg: string;
  accent: string;
  accentDim: string;
  sendBg: string;
  sendFg: string;
  userBubble: string;
  userBubbleText: string;
}

export const darkTheme: Theme = {
  bg:           '#0d0d0d',
  bgA:          '#141414',
  text1:        '#f5f5f5',
  text2:        'rgba(245,245,245,0.65)',
  text3:        'rgba(245,245,245,0.35)',
  border:       'rgba(255,255,255,0.10)',
  borderB:      'rgba(255,255,255,0.07)',
  glass1:       'rgba(255,255,255,0.06)',
  glass2:       'rgba(255,255,255,0.05)',
  glass3:       'rgba(255,255,255,0.08)',
  inputBg:      'rgba(255,255,255,0.06)',
  accent:       '#5e9cff',
  accentDim:    'rgba(94,156,255,0.15)',
  sendBg:       '#007aff',
  sendFg:       '#ffffff',
  userBubble:   '#2f2f2f',
  userBubbleText: 'rgba(255,255,255,0.92)',
};

export const lightTheme: Theme = {
  bg:           '#f2f2f7',
  bgA:          '#ffffff',
  text1:        '#1c1c1e',
  text2:        'rgba(28,28,30,0.65)',
  text3:        'rgba(28,28,30,0.40)',
  border:       'rgba(0,0,0,0.10)',
  borderB:      'rgba(0,0,0,0.07)',
  glass1:       'rgba(0,0,0,0.03)',
  glass2:       'rgba(0,0,0,0.04)',
  glass3:       'rgba(0,0,0,0.06)',
  inputBg:      'rgba(0,0,0,0.04)',
  accent:       '#007aff',
  accentDim:    'rgba(0,122,255,0.12)',
  sendBg:       '#007aff',
  sendFg:       '#ffffff',
  userBubble:   '#e5e5ea',
  userBubbleText: '#1c1c1e',
};
