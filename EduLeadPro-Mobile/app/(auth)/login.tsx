/**
 * Login Screen - Premium UI with Expo Router
 * Combines premium design from root LoginScreen.tsx with Expo Router navigation
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar,
    Alert,
    Modal,
    Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows, layout } from '../../src/theme';
import PremiumButton from '../../src/components/ui/PremiumButton';
import PremiumInput from '../../src/components/ui/PremiumInput';
import PremiumCard from '../../src/components/ui/PremiumCard';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuthStore();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Animations
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(50)).current;

    // Password Change State
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changeLoading, setChangeLoading] = useState(false);

    useEffect(() => {
        // Entrance Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Missing Info', 'Please enter both phone number and password');
            return;
        }

        setLoading(true);
        try {
            await login(phone, password);
            // Navigation happens automatically via _layout.tsx auth state
        } catch (error: any) {
            console.error(error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Invalid credentials';

            // Check for network/connection related errors
            const isConnectionError = errorMessage.toLowerCase().includes('network') ||
                errorMessage.toLowerCase().includes('connection') ||
                errorMessage.toLowerCase().includes('fetch');

            if (isConnectionError) {
                Alert.alert('Connection Error', 'Please check your internet connection.');
            } else {
                Alert.alert('Login Failed', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

            {/* Background */}
            <LinearGradient
                colors={[colors.primaryDark, colors.primary, colors.background]}
                locations={[0, 0.4, 1]}
                style={styles.background}
            />

            {/* Header Content */}
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logoImage}
                        resizeMode="cover"
                    />
                </View>
                <Text style={styles.title}>Parent Portal</Text>
                <Text style={styles.subtitle}>Powered by EduConnect</Text>
            </Animated.View>

            {/* Login Form Card */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <Animated.View style={{
                    transform: [{ translateY: slideAnim }],
                    opacity: fadeAnim,
                    width: '100%',
                    paddingHorizontal: spacing.lg
                }}>
                    <PremiumCard style={styles.card}>

                        <Text style={styles.cardTitle}>Welcome Back</Text>
                        <Text style={styles.cardSub}>Stay connected with your child's progress</Text>

                        <View style={{ height: spacing.lg }} />

                        <PremiumInput
                            label="Mobile Number"
                            placeholder="9876543210"
                            icon="smartphone"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <PremiumInput
                            label="Password"
                            placeholder="Enter your password"
                            icon="lock"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <View style={{ height: spacing.md }} />

                        <PremiumButton
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            icon="log-in"
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.orText}>Internal Access</Text>
                            <View style={styles.line} />
                        </View>

                        <Text style={styles.footerText}>
                            Teachers & Staff members use your registered credentials.
                        </Text>
                    </PremiumCard>
                </Animated.View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    background: {
        position: 'absolute',
        left: 0, right: 0, top: 0,
        height: height * 0.6,
    },
    header: {
        marginTop: height * 0.12,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        marginBottom: spacing.md,
        ...shadows.md,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    title: {
        ...typography.h1,
        color: colors.textInverted,
        fontSize: 32,
    },
    subtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: spacing.xs,
        fontSize: 14,
        letterSpacing: 0.5,
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    card: {
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    cardTitle: {
        ...typography.h2,
        color: colors.primary,
        textAlign: 'center',
    },
    cardSub: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    orText: {
        ...typography.caption,
        marginHorizontal: spacing.md,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    footerText: {
        ...typography.caption,
        textAlign: 'center',
        color: colors.textTertiary,
        marginHorizontal: spacing.sm,
    },
});
