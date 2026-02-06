/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layout/**/*.{js,ts,jsx,tsx,mdx}',
    './src/utils/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pantheon Primary Colors
        pnth: {
          bg: '#030712',
          green: '#61CA87',
          'green-light': '#7dd49e',
          'green-dark': '#4fb574',
          red: '#d55355',
        },

        // Text - Pantheon Style
        textPrimary: '#ffffff',
        textSecondary: '#9ca3af',
        textTertiary: '#6b7280',
      
        // Depth Layers - Pantheon Dark Theme
        bgBase: '#030712',
        bgDarkest: '#030712',
        bgBaseAlt: '#050810',
        bgOverlay: 'rgba(17, 24, 39, 0.7)',
        bgOverlayAlt: 'rgba(17, 24, 39, 0.6)',
        bgTableAlt: 'rgba(17, 24, 39, 0.4)',
        bgTableHover: 'rgba(97, 202, 135, 0.08)',

        // Core Background Layers - Pantheon
        bgPrimary: '#0a0a0f',
        bgSecondary: '#0f1116',
        bgDeepAlt: '#111827',
        bgTertiary: '#1f2937',
      
        // Neutral Layers
        bgNeutral: '#111827',
        bgNeutralDark: '#0d1117',
      
        // Surfaces & Components - Glass Morphism
        bgSurface: 'rgba(17, 24, 39, 0.6)',
        bgSurfaceAlt: 'rgba(17, 24, 39, 0.7)',
        bgContainer: 'rgba(17, 24, 39, 0.5)',
        bgPanel: 'rgba(31, 41, 55, 0.8)',
        bgSectionAlt: 'rgba(31, 41, 55, 0.6)',
        bgCard: 'rgba(17, 24, 39, 0.7)',
        bgElevated: 'rgba(31, 41, 55, 0.7)',
        bgMuted: 'rgba(17, 24, 39, 0.4)',
        bgHighlight: 'rgba(97, 202, 135, 0.08)',
      
        // Overlays & Tints
        bgBackdrop: 'rgba(3, 7, 18, 0.8)',
        bgSuccessTint: 'rgba(97, 202, 135, 0.15)',
      
        // Grays & Whites
        grayLight: '#d1d5db',
        grayMedium: '#9ca3af',
        grayDark: '#6b7280',
        grayGhost: '#d1d5db',
        grayNeutral: '#6b7280',
        grayBorder: '#374151',
        graySlate: '#6b7280',
        graySlateDark: '#4b5563',
        whiteOverlay: 'rgba(255, 255, 255, 0.9)',
        whiteTranslucent: 'rgba(255, 255, 255, 0.6)',
        grayExtraLight: '#e5e7eb',
        grayCool: '#6b7280',
      
        // Status & Accent Colors - Pantheon
        success: '#61CA87',
        error: '#d55355',
        warning: '#fbbf24',
        errorBright: '#ef4444',
        accentRose: '#ec4899',
        accentPurple: '#8b5cf6',
      
        // Borders - Pantheon Green Tinted
        borderPrimary: 'rgba(97, 202, 135, 0.15)',
        borderDefault: 'rgba(97, 202, 135, 0.1)',
        borderSecondary: 'rgba(97, 202, 135, 0.2)',
        borderSurface: 'rgba(97, 202, 135, 0.12)',
        borderSuccess: '#61CA87',
        borderMuted: 'rgba(97, 202, 135, 0.08)',
        borderTertiary: 'rgba(97, 202, 135, 0.06)',
        borderDarkSlateGray: 'rgba(55, 65, 81, 0.5)',

        // Override default green with Pantheon green
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#61ca87',
          500: '#61ca87',
          600: '#4fb574',
          700: '#3d9060',
          800: '#2f6b4d',
          900: '#1e4532'
        },

        // Override default red with Pantheon red
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a6',
          400: '#f87171',
          500: '#d55355',
          600: '#d55355',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
      },      
      fontFamily: {
        menlo: ['Geist Mono', 'Menlo', 'monospace'],
        geist: ['Geist Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '30px'],
        '2xl': ['24px', '36px'],
        '3xl': ['32px', '48px'],
      },
      letterSpacing: {
        tighter: '-0.32px',
        normal: '0px',
        wide: '0.5px',
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        bold: 700,
      },
      animation: {
        blink: 'blink 10s infinite',
        spinSlow: 'spinSlow 10s linear infinite',
        'grid-pulse': 'grid-pulse 6s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%': { opacity: '0.2' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.2' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'grid-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'pnth-glow': '0 0 20px rgba(97, 202, 135, 0.2), 0 0 50px rgba(97, 202, 135, 0.08)',
        'pnth-glow-lg': '0 0 30px rgba(97, 202, 135, 0.3), 0 0 80px rgba(97, 202, 135, 0.12)',
        'pnth-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
};
