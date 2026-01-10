import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Pressable,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography } from '../../theme';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.8;

interface PremiumSideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

type MenuIconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
    icon: MenuIconName;
    label: string;
    route: string;
    description?: string;
}

interface MenuGroup {
    title: string;
    items: MenuItem[];
}

export default function PremiumSideMenu({ isOpen, onClose }: PremiumSideMenuProps) {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isOpen) {
            // Open animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Close animation
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isOpen]);

    const handleLogout = async () => {
        onClose();
        await logout();
        router.replace('/(auth)/login');
    };

    const navigateTo = (route: string) => {
        onClose();
        router.push(route as any);
    };

    const parentMenu: MenuGroup[] = [
        {
            title: 'MAIN MENU',
            items: [
                { icon: 'grid-outline', label: 'Dashboard', route: '/(parent)', description: 'Daily overview' },
                { icon: 'bus-outline', label: 'School Bus', route: '/(parent)/bus-tracking', description: 'Real-time status' },
                { icon: 'card-outline', label: 'Fees & Payments', route: '/(parent)/fees', description: 'Due status' },
            ]
        },
        {
            title: 'SCHOOL LIFE',
            items: [
                { icon: 'analytics-outline', label: 'Activities', route: '/(parent)/activities', description: 'Class updates' },
            ]
        },
        {
            title: 'SUPPORT',
            items: [
                { icon: 'help-circle-outline', label: 'Help & Support', route: '/(parent)/support' },
            ]
        }
    ];

    if (!isOpen && (fadeAnim as any)._value === 0) return null;

    return (
        <View style={styles.overlayRoot} pointerEvents={isOpen ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Animated.View
                style={[styles.backdrop, { opacity: fadeAnim }]}
            >
                <Pressable style={styles.flex1} onPress={onClose} />
            </Animated.View>

            {/* Sidebar Content */}
            <Animated.View
                style={[
                    styles.menuContainer,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                <View style={styles.container}>
                    {/* Header Section */}
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.header}
                    >
                        <View style={styles.profileSection}>
                            <View style={styles.avatarContainer}>
                                <LinearGradient
                                    colors={[colors.accent, '#D97706']}
                                    style={styles.avatarGradient}
                                >
                                    <Text style={styles.avatarText}>
                                        {user?.name?.charAt(0).toUpperCase() || 'P'}
                                    </Text>
                                </LinearGradient>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName} numberOfLines={1}>
                                    {user?.name || 'Parent Portal'}
                                </Text>
                                <Text style={styles.userRole}>Welcome to {(user as any)?.organizationName || 'EduConnect'}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <ScrollView
                        style={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {parentMenu.map((group, gIdx) => (
                            <View key={gIdx} style={styles.menuGroup}>
                                <Text style={styles.groupTitle}>{group.title}</Text>
                                {group.items.map((item, iIdx) => (
                                    <TouchableOpacity
                                        key={iIdx}
                                        style={styles.menuItem}
                                        onPress={() => navigateTo(item.route)}
                                    >
                                        <View style={styles.iconBox}>
                                            <Ionicons
                                                name={item.icon}
                                                size={20}
                                                color={colors.textSecondary}
                                            />
                                        </View>
                                        <View style={styles.itemTextContainer}>
                                            <Text style={styles.menuLabel}>{item.label}</Text>
                                            {item.description && (
                                                <Text style={styles.menuDescription}>{item.description}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Footer / Logout */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <View style={styles.logoutIconBox}>
                                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                            </View>
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlayRoot: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 10,
    },
    flex1: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    menuContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: MENU_WIDTH,
        backgroundColor: colors.surface,
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 20,
    },
    container: {
        flex: 1,
    },
    header: {
        paddingTop: spacing.xxl + 10,
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderBottomRightRadius: 30,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        padding: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        ...typography.h3,
        color: 'white',
        fontWeight: '800',
    },
    userInfo: {
        marginLeft: spacing.md,
        flex: 1,
    },
    userName: {
        ...typography.body,
        color: 'white',
        fontWeight: '700',
    },
    userRole: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
    },
    closeBtn: {
        padding: 5,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    menuGroup: {
        marginBottom: spacing.xl,
    },
    groupTitle: {
        ...typography.caption,
        color: colors.textTertiary,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: 16,
        marginBottom: 4,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: {
        marginLeft: spacing.md,
        flex: 1,
    },
    menuLabel: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    menuDescription: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 11,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    logoutIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.danger + '10', // 10% opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        ...typography.body,
        fontWeight: '700',
        color: colors.danger,
        marginLeft: spacing.md,
    },
    versionText: {
        fontSize: 10,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
