import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { colors, shadows, spacing } from '../../theme';

interface PremiumCardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'flat' | 'outlined';
    style?: ViewStyle;
}

export default function PremiumCard({
    children,
    variant = 'elevated',
    style,
}: PremiumCardProps) {

    const getContainerStyle = () => {
        let baseStyle: ViewStyle = {
            backgroundColor: colors.surface,
            borderRadius: spacing.borderRadius.lg, // 24px usually
            padding: spacing.md,
            overflow: 'hidden', // Ensures inner content respects radius
        };

        switch (variant) {
            case 'flat':
                baseStyle = { ...baseStyle, backgroundColor: colors.surfaceHighlight };
                break;
            case 'outlined':
                baseStyle = {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border
                };
                break;
            case 'elevated':
            default:
                baseStyle = {
                    ...baseStyle,
                    ...shadows.md,
                    borderWidth: Platform.OS === 'android' ? 0 : 0.5,
                    borderColor: 'rgba(0,0,0,0.05)', // Subtle border for iOS pop
                };
                break;
        }

        return baseStyle;
    };

    return (
        <View style={[getContainerStyle(), style]}>
            {children}
        </View>
    );
}
