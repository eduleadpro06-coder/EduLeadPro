/**
 * Color Palette - Matches the mockup designs
 */

export const colors = {
    // Primary Colors (Purple theme)
    primary: '#4f46e5',        // Indigo 600
    primaryDark: '#4338ca',    // Indigo 700
    primaryLight: '#818cf8',   // Indigo 400

    // Status Colors
    success: '#10b981',        // Emerald 500
    warning: '#f97316',        // Orange 500
    danger: '#ef4444',         // Red 500
    neutral: '#6b7280',        // Gray 500

    // Background Colors
    background: '#f9fafb',     // Gray 50
    backgroundDark: '#111827', // Gray 900
    white: '#ffffff',
    black: '#000000',

    // Text Colors
    text: {
        primary: '#111827',      // Gray 900
        secondary: '#6b7280',    // Gray 500
        light: '#9ca3af',        // Gray 400
        white: '#ffffff',
    },

    // Card & Surface Colors
    card: '#ffffff',
    cardBorder: '#e5e7eb',     // Gray 200

    // Gradient Colors (for buttons and headers)
    gradient: {
        start: '#4f46e5',
        end: '#7c3aed',          // Violet 600
    },
};

export type ColorKey = keyof typeof colors;
