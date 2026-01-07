import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    Animated,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, shadows, spacing, typography, animation } from '../../theme';

interface PremiumButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: keyof typeof Feather.glyphMap;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export default function PremiumButton({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    style,
    textStyle,
}: PremiumButtonProps) {
    // Animation for press effect
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: animation.scalePress,
            useNativeDriver: true,
            ...animation.spring
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            ...animation.spring
        }).start();
    };

    const getContainerStyle = () => {
        let baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: spacing.borderRadius.md,
            opacity: disabled ? 0.6 : 1,
        };

        // Size
        switch (size) {
            case 'sm':
                baseStyle = { ...baseStyle, height: 36, paddingHorizontal: 12 };
                break;
            case 'lg':
                baseStyle = { ...baseStyle, height: 56, paddingHorizontal: 32 };
                break;
            case 'md':
            default:
                baseStyle = { ...baseStyle, height: 48, paddingHorizontal: 24 };
                break;
        }

        // Variant (Non-Gradient parts)
        switch (variant) {
            case 'secondary':
                baseStyle = { ...baseStyle, backgroundColor: colors.surfaceHighlight };
                break;
            case 'outline':
                baseStyle = {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: colors.border
                };
                break;
            case 'ghost':
                baseStyle = { ...baseStyle, backgroundColor: 'transparent' };
                break;
            case 'danger':
                baseStyle = { ...baseStyle, backgroundColor: colors.danger };
                break;
            case 'primary':
            default:
                // Gradient handled in render
                break;
        }

        // Shadow for solid buttons
        if ((variant === 'primary' || variant === 'danger') && !disabled) {
            baseStyle = { ...baseStyle, ...shadows.md, shadowColor: variant === 'danger' ? colors.danger : colors.primary };
        }

        return baseStyle;
    };

    const getTextColor = () => {
        if (disabled) return colors.textTertiary;
        switch (variant) {
            case 'secondary': return colors.primary;
            case 'outline': return colors.primary;
            case 'ghost': return colors.primary;
            case 'danger': return colors.textInverted;
            case 'primary': return colors.textInverted;
            default: return colors.textInverted;
        }
    };

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {icon && (
                        <Feather
                            name={icon}
                            size={size === 'sm' ? 16 : 20}
                            color={getTextColor()}
                            style={{ marginRight: spacing.sm }}
                        />
                    )}
                    <Text style={[
                        typography.button,
                        { color: getTextColor(), fontSize: size === 'sm' ? 14 : 16 },
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </>
    );

    const ButtonWrapper = () => {
        if (variant === 'primary' && !disabled) {
            return (
                <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[getContainerStyle(), style]}
                >
                    {content}
                </LinearGradient>
            );
        }
        return (
            <Animated.View style={[getContainerStyle(), style]}>
                {content}
            </Animated.View>
        );
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={disabled || loading}
            >
                <ButtonWrapper />
            </TouchableOpacity>
        </Animated.View>
    );
}
