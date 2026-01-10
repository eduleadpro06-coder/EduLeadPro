import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Pressable,
    Platform,
    Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../../theme';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

interface MenuItem {
    id: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
}

interface PremiumDrawerProps {
    isVisible: boolean;
    onClose: () => void;
    activeTab: string;
    onSelectTab: (tabId: string) => void;
    menuItems: MenuItem[];
    user: {
        name: string;
        role: string;
        email?: string;
        photo?: string;
    };
    onLogout: () => void;
}

export default function PremiumDrawer({
    isVisible,
    onClose,
    activeTab,
    onSelectTab,
    menuItems,
    user,
    onLogout
}: PremiumDrawerProps) {
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
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
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
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
    }, [isVisible]);

    if (!isVisible && slideAnim._value === -DRAWER_WIDTH) return null;

    return (
        <View style={StyleSheet.absoluteFillObject} pointerEvents={isVisible ? 'auto' : 'none'}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            {/* Drawer Content */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                <LinearGradient
                    colors={[colors.primaryDark, colors.primary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.userSection}>
                        <View style={styles.avatar}>
                            <Feather name="user" size={32} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.userName}>{user.name}</Text>
                            <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.menuContainer}>
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.menuItem, isActive && styles.activeMenuItem]}
                                onPress={() => {
                                    onSelectTab(item.id);
                                    onClose();
                                }}
                            >
                                <View style={[styles.iconBox, isActive && { backgroundColor: 'transparent' }]}>
                                    <Feather
                                        name={item.icon}
                                        size={22}
                                        color={isActive ? colors.accent : colors.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                        <Feather name="log-out" size={20} color={colors.danger} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: colors.background,
        ...shadows.lg,
        borderTopRightRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    userName: {
        ...typography.h3,
        color: colors.textInverted,
        fontSize: 18,
    },
    userRole: {
        ...typography.caption,
        color: colors.accent,
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 4,
    },
    menuContainer: {
        flex: 1,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    activeMenuItem: {
        backgroundColor: colors.surfaceHighlight, // or colors.primary + '10'
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
    },
    iconBox: {
        width: 32,
        alignItems: 'center',
        marginRight: 12,
    },
    menuLabel: {
        ...typography.body,
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    activeMenuLabel: {
        color: colors.primary,
        fontWeight: '700',
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
    },
    logoutText: {
        ...typography.button,
        color: colors.danger,
        marginLeft: 12,
    },
});
