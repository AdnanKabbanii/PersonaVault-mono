import { Inter, JetBrains_Mono, Poppins } from 'next/font/google'

// Primary font - Inter for body text (system font fallback)
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize for performance
  variable: '--font-inter',
  preload: true,
})

// Display font - Poppins for headings
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
})

// Monospace font - JetBrains Mono for code
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  preload: false, // Only load when needed
})

// Font family definitions
export const fontFamilies = {
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  display: ['var(--font-poppins)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
} as const

// Font weight scale
export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

// Font size scale (following 8px grid)
export const fontSizes = {
  xs: '0.875rem',   // 14px (increased from 12px)
  sm: '1rem',       // 16px (increased from 14px)
  base: '1.125rem', // 18px (increased from 16px)
  lg: '1.25rem',    // 20px (increased from 18px)
  xl: '1.5rem',     // 24px (increased from 20px)
  '2xl': '1.875rem', // 30px (increased from 24px)
  '3xl': '2.25rem',  // 36px (increased from 30px)
  '4xl': '3rem',     // 48px (increased from 44px)
  '5xl': '3.75rem',  // 60px (increased from 56px)
  '6xl': '4.5rem',   // 72px (increased from 68px)
  '7xl': '5.5rem',   // 88px (increased from 80px)
  '8xl': '7rem',     // 112px (increased from 104px)
  '9xl': '9rem',     // 144px (increased from 136px)
} as const

// Line height scale
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const

// Letter spacing scale
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const

// Typography presets for consistent usage
export const typography = {
  // Display styles
  'display-1': {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['6xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  'display-2': {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
  },
  'display-3': {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  
  // Heading styles
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  
  // Body styles
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  'body-small': {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  'body-large': {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  
  // UI styles
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
  },
  button: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },
  
  // Code styles
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
  'code-large': {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
} as const

// Export all fonts for use in layout
export const fonts = {
  inter,
  poppins,
  jetbrainsMono,
} 