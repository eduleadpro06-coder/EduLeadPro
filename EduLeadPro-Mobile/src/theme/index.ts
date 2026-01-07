import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 1. Color Palette: "Deep Slate & Gold"
// A sophisticated, high-contrast palette for a premium feel.
export const colors = {
    // Brand Colors
    primary: '#0F172A',      // Deep Slate Navy (Professional, Trust)
    primaryDark: '#020617',  // Midnight (Depth)
    primaryLight: '#334155', // Lighter Slate (Subtle backgrounds)

    accent: '#F59E0B',       // Amber Gold (Call to Action, Highlights)
    accentLight: '#FEF3C7',  // Soft Amber (Backgrounds)

    // Neutral Tones
    background: '#F8FAFC',   // Cool White (Clean, Modern Page Background)
    surface: '#FFFFFF',      // Pure White (Cards, Sheets)
    surfaceHighlight: '#F1F5F9', // Subtle Interaction State

    // Text Colors
    textPrimary: '#1E293B',  // Slate 800 (High Readability)
    textSecondary: '#64748B',// Slate 500 (Subtitles)
    textTertiary: '#94A3B8', // Slate 400 (Placeholders)
    textInverted: '#FFFFFF', // White Text on Dark Backgrounds

    // Functional Colors (Muted/Pastel for elegance)
    success: '#10B981',      // Emerald
    successBg: '#D1FAE5',
    warning: '#F59E0B',      // Amber
    warningBg: '#FEF3C7',
    danger: '#EF4444',       // Red
    dangerBg: '#FEE2E2',
    info: '#3B82F6',         // Blue
    infoBg: '#DBEAFE',

    // Borders & Dividers
    border: '#E2E8F0',       // Slate 200
    divider: '#F1F5F9',      // Slate 100
};

// 2. Shadows & Elevation (Soft, diffuse shadows)
export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
    },
    glow: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
};

// 3. Spacing & Layout
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    screenPadding: 24,
    borderRadius: {
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        circle: 9999,
    }
};

// 4. Typography (Clean, readable, well-spaced)
export const typography = {
    h1: { fontSize: 32, fontWeight: '800' as const, color: colors.textPrimary, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
    subtitle: { fontSize: 16, fontWeight: '500' as const, color: colors.textSecondary, lineHeight: 24 },
    body: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
    caption: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    button: { fontSize: 16, fontWeight: '700' as const, letterSpacing: 0.5 },
};

// 5. Animation Constants
export const animation = {
    scalePress: 0.96,
    duration: 300,
    spring: { damping: 15, stiffness: 120 },
};

export const layout = {
    width,
    height,
    isSmallDevice: width < 375,
};

export default { colors, shadows, spacing, typography, animation, layout };
