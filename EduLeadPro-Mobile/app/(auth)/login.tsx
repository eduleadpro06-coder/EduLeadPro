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
    ScrollView,
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
const isSmallScreen = height < 700;

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
            console.log('[LoginScreen] Calling authStore.login...');
            const response = await login(phone, password);
            console.log('[LoginScreen] Got response from authStore:', JSON.stringify(response));

            if (response.requiresPasswordChange) {
                console.log('[LoginScreen] setting showChangePassword = true!');
                setShowChangePassword(true);
            } else {
                console.log('[LoginScreen] requiresPasswordChange was falsy!');
            }
            // Navigation happens automatically via _layout.tsx auth state if not showing modal
        } catch (error: any) {
            console.error('[LoginScreen] Error caught:', error);
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

    const handlePasswordChange = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 4) {
            Alert.alert('Error', 'Password must be at least 4 characters');
            return;
        }

        setChangeLoading(true);
        try {
            const { authAPI } = require('../../src/services/api/auth.api');
            const response = await authAPI.changePassword(phone, newPassword);

            if (response.success) {
                Alert.alert('Success', 'Password updated successfully. Please login with your new password.');
                setShowChangePassword(false);
                logout(); // Logout after password change to force fresh login
            } else {
                Alert.alert('Update Failed', response.message || 'Could not update password');
            }
        } catch (error: any) {
            console.error('Password change error:', error);
            Alert.alert('Error', error.message || 'Failed to update password');
        } finally {
            setChangeLoading(false);
        }
    };

    const logout = useAuthStore(state => state.logout);

    console.log('[LoginScreen] RENDERING. showChangePassword state is:', showChangePassword);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

            {/* If Change Password is required, violently swap the screen to ONLY show this form! */}
            {showChangePassword ? (
                <View style={styles.changePasswordScreen}>
                    <Text style={styles.modalTitle}>Security Update Required</Text>
                    <Text style={styles.modalSub}>Please change your default password to continue.</Text>

                    <PremiumInput
                        label="New Password"
                        placeholder="Min 4 characters"
                        icon="lock"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />

                    <PremiumInput
                        label="Confirm Password"
                        placeholder="Re-enter password"
                        icon="check-circle"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <View style={{ height: spacing.lg }} />

                    <PremiumButton
                        title="Update Password"
                        onPress={handlePasswordChange}
                        loading={changeLoading}
                        icon="save"
                    />
                </View>
            ) : (
                <>
                    {/* Background */}
                    <LinearGradient
                        colors={[colors.primaryDark, colors.primary, colors.background]}
                        locations={[0, 0.4, 1]}
                        style={styles.background}
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                        >
                            {/* Header Content */}
                            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                                <View style={styles.logoContainer}>
                                    <Image
                                        source={require('../../assets/logo.png')}
                                        style={styles.logoImage}
                                        resizeMode="cover"
                                    />
                                </View>
                                <Text style={styles.title}>Bloomdale Connect</Text>
                            </Animated.View>

                            {/* Login Form Card */}
                            <Animated.View style={{
                                transform: [{ translateY: slideAnim }],
                                opacity: fadeAnim,
                                width: '100%',
                                paddingHorizontal: spacing.lg
                            }}>
                                <PremiumCard style={styles.card}>
                                    <Text style={styles.cardTitle}>Welcome Back</Text>
                                    <Text style={styles.cardSub}>Stay connected with your child's progress</Text>

                                    <View style={{ height: spacing.md }} />

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
                        </ScrollView>
                    </KeyboardAvoidingView>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    changePasswordScreen: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: colors.surface,
    },
    background: {
        position: 'absolute',
        left: 0, right: 0, top: 0,
        height: height * 0.55,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        marginTop: isSmallScreen ? height * 0.06 : height * 0.1,
        alignItems: 'center',
        marginBottom: isSmallScreen ? spacing.md : spacing.xl,
    },
    logoContainer: {
        width: isSmallScreen ? 90 : 120,
        height: isSmallScreen ? 90 : 120,
        borderRadius: isSmallScreen ? 45 : 60,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        marginBottom: isSmallScreen ? spacing.sm : spacing.md,
        ...shadows.lg,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
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
        fontSize: isSmallScreen ? 26 : 32,
    },
    subtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: spacing.xs,
        fontSize: 14,
        letterSpacing: 0.5,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: spacing.xl,
        width: '100%',
        ...shadows.lg,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    modalSub: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
});
