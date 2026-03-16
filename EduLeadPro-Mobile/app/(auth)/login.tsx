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
            const response = await login(phone, password);

            if (response.requiresPasswordChange) {
                setShowChangePassword(true);
            }
            // Navigation happens automatically via _layout.tsx auth state if not showing modal
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
                <Text style={styles.subtitle}>Powered by Bloomdale Preschool | Dedicated to Excellence</Text>
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

            {/* Change Password Modal */}
            <Modal
                visible={showChangePassword}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <Text style={styles.modalSub}>For security, please change your default password.</Text>

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
                </View>
            </Modal>
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
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        marginBottom: spacing.md,
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
