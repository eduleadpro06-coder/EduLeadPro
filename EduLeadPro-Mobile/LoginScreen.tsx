import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    Image,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { api, type Child } from './services/api';

const { width, height } = Dimensions.get('window');

const colors = {
    primary: '#2D7A5F',
    primaryDark: '#1F5A45',
    accent: '#34D399',
    white: '#FFFFFF',
    background: '#F0FDF4', // Very light mint/white
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    inputBg: '#F9FAFB',
    danger: '#EF4444',
};

interface LoginScreenProps {
    onLoginSuccess: (user: any, students: Child[]) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Change State
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changeLoading, setChangeLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Missing Info', 'Please enter both phone number and password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.login(phone, password);

            if (response.success && response.user) {
                if (response.requiresPasswordChange) {
                    setShowChangePassword(true);
                } else {
                    onLoginSuccess(response.user, response.students || []);
                }
            } else {
                Alert.alert('Login Failed', response.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Connection Error', 'Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
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
            const result = await api.changePassword(phone, newPassword);
            if (result.success) {
                Alert.alert('Success', 'Password updated! Logging you in...');
                setShowChangePassword(false);
                const response = await api.login(phone, newPassword);
                if (response.success) {
                    onLoginSuccess(response.user, response.students || []);
                }
            } else {
                Alert.alert('Update Failed', result.message || 'Could not update password');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to change password. Try again.');
        } finally {
            setChangeLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Header */}
            <LinearGradient
                colors={[colors.primaryDark, colors.primary]}
                style={styles.headerBackground}
            >
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Feather name="book-open" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.appTitle}>EduLead Pro</Text>
                    <Text style={styles.appSubtitle}>Parent Portal</Text>
                </View>

                {/* Decorative Circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </LinearGradient>

            {/* Main Content (Login Card) */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <View style={styles.cardContainer}>
                    <View style={styles.welcomeContainer}>
                        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                        <Text style={styles.welcomeSub}>Sign in to view your child's progress</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Phone Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Mobile Number</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="smartphone" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 9876543210"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>
                            <Text style={styles.hint}>Default password: 1234</Text>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.primaryDark]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginButton}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                )}
                                {!loading && <Feather name="arrow-right" size={20} color="white" style={{ marginLeft: 8 }} />}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Subtle Internal Access Info */}
                        <View style={styles.staffLoginInfo}>
                            <View style={styles.divider} />
                            <Text style={styles.staffLoginText}>Internal Access</Text>
                            <Text style={styles.staffLoginSub}>Authorized personnel can sign in here using their registered credentials for official duties.</Text>
                        </View>

                        {/* Help Link */}
                        <TouchableOpacity style={styles.helpButton}>
                            <Text style={styles.helpText}>Need help signing in?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Change Password Modal */}
            <Modal
                visible={showChangePassword}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View style={[styles.iconCircle, { width: 50, height: 50, marginBottom: 0 }]}>
                                    <Feather name="shield" size={24} color={colors.primary} />
                                </View>
                                <Text style={styles.modalTitle}>Set New Password</Text>
                            </View>

                            <Text style={styles.modalSubtitle}>
                                For your security, please set a new password for your account.
                            </Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Feather name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="New Password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputContainer, { marginBottom: 24 }]}>
                                <View style={styles.inputWrapper}>
                                    <Feather name="check-circle" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm New Password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleChangePassword}
                                disabled={changeLoading}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primaryDark]}
                                    style={styles.loginButton}
                                >
                                    {changeLoading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Update Password</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
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
    headerBackground: {
        height: height * 0.45,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 60,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    logoContainer: {
        alignItems: 'center',
        zIndex: 10,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    appSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        fontWeight: '500',
    },
    // Decorative
    circle1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    circle2: {
        position: 'absolute',
        top: 50,
        right: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    keyboardView: {
        flex: 1,
        marginTop: -80, // Overlap the header
    },
    cardContainer: {
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    welcomeContainer: {
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    welcomeSub: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        height: '100%',
    },
    hint: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 4,
        marginTop: 4,
    },
    loginButton: {
        flexDirection: 'row',
        height: 54,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    helpButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    helpText: {
        color: colors.textSecondary,
        fontSize: 14,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: 12,
    },
    modalSubtitle: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    staffLoginInfo: {
        marginTop: 12,
        alignItems: 'center',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 16,
    },
    staffLoginText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 4,
    },
    staffLoginSub: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 18,
    },
});
