import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    Animated,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../../theme';

interface PremiumInputProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Feather.glyphMap;
    error?: string;
    hint?: string;
}

export default function PremiumInput({
    label,
    icon,
    error,
    hint,
    style,
    onFocus,
    onBlur,
    ...props
}: PremiumInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = React.useRef(new Animated.Value(0)).current;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.timing(focusAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false, // color interpolation needs false
        }).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        Animated.timing(focusAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onBlur?.(e);
    };

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.accent]
    });

    const backgroundColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.surfaceHighlight, colors.surface]
    });

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <Animated.View style={[
                styles.inputWrapper,
                {
                    borderColor: error ? colors.danger : borderColor,
                    backgroundColor: backgroundColor,
                    borderWidth: isFocused ? 1.5 : 1,
                    ...Platform.select({
                        ios: isFocused ? shadows.sm : {},
                        android: isFocused ? { elevation: 2 } : {},
                    })
                },
                style
            ]}>
                {icon && (
                    <Feather
                        name={icon}
                        size={20}
                        color={isFocused ? colors.accent : colors.textTertiary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    placeholderTextColor={colors.textTertiary}
                    style={styles.input}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    selectionColor={colors.accent}
                    {...props}
                />
                {error && (
                    <Feather name="alert-circle" size={16} color={colors.danger} style={{ marginLeft: 8 }} />
                )}
            </Animated.View>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : hint ? (
                <Text style={styles.hintText}>{hint}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: spacing.borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 52,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        height: '100%',
        ...typography.body,
        color: colors.textPrimary,
    },
    errorText: {
        ...typography.caption,
        color: colors.danger,
        marginTop: 4,
        marginLeft: 4,
    },
    hintText: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 4,
        marginLeft: 4,
    }
});
