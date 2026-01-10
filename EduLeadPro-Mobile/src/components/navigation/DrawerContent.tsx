import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    Dimensions,
} from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, shadows, layout } from '../../theme';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

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

export default function DrawerContent(props: DrawerContentComponentProps) {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const activeRoute = props.state.routeNames[props.state.index];

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const parentMenu: MenuGroup[] = [
        {
            title: 'MAIN MENU',
            items: [
                { icon: 'grid-outline', label: 'Dashboard', route: '/(parent)', description: 'Daily overview' },
                { icon: 'bus-outline', label: 'Bus Tracking', route: '/(parent)/bus-tracking', description: 'Live location' },
                { icon: 'card-outline', label: 'Fees & Payments', route: '/(parent)/fees', description: 'Due status' },
            ]
        },
        {
            title: 'SCHOOL LIFE',
            items: [
                { icon: 'analytics-outline', label: 'Activities', route: '/(parent)/activities', description: 'Class updates' },
                { icon: 'chatbubbles-outline', label: 'Messages', route: '/(parent)/chat', description: 'Connect with teachers' },
                { icon: 'notifications-outline', label: 'Announcements', route: '/(parent)/announcements', description: 'School news' },
            ]
        },
        {
            title: 'SUPPORT',
            items: [
                { icon: 'settings-outline', label: 'Settings', route: '/(parent)/settings', description: 'App preferences' },
                { icon: 'help-circle-outline', label: 'Help & Support', route: '/(parent)/support', description: 'Need help?' },
            ]
        }
    ];

    const staffMenu: MenuGroup[] = [
        {
            title: 'MANAGEMENT',
            items: [
                { icon: 'grid-outline', label: 'Dashboard', route: '/(teacher)/dashboard' },
                { icon: 'checkbox-outline', label: 'Attendance', route: '/(teacher)/attendance' },
                { icon: 'add-circle-outline', label: 'Post Update', route: '/(teacher)/activity' },
            ]
        },
        {
            title: 'COMMUNICATION',
            items: [
                { icon: 'people-outline', label: 'Students', route: '/(teacher)/students' },
                { icon: 'chatbubbles-outline', label: 'Chat', route: '/(teacher)/chat' },
            ]
        }
    ];

    const menuItems = user?.role === 'teacher' || user?.role === 'driver' ? staffMenu : parentMenu;

    return (
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
                        <Text style={styles.userRole}>
                            {user?.role === 'teacher' ? 'Faculty Member' : user?.role === 'driver' ? 'Transport Staff' : 'Guardian'}
                        </Text>
                    </View>
                </View>

                {/* Quick Stats/Info */}
                <View style={styles.headerFooter}>
                    <View style={styles.statItem}>
                        <View style={styles.dot} />
                        <Text style={styles.statText}>Active Session</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {menuItems.map((group, gIdx) => (
                    <View key={gIdx} style={styles.menuGroup}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        {group.items.map((item, iIdx) => {
                            const isActive = activeRoute === item.route.split('/').pop();
                            return (
                                <TouchableOpacity
                                    key={iIdx}
                                    style={[
                                        styles.menuItem,
                                        isActive && styles.activeMenuItem
                                    ]}
                                    onPress={() => router.push(item.route as any)}
                                >
                                    <View style={[
                                        styles.iconBox,
                                        isActive && styles.activeIconBox
                                    ]}>
                                        <Ionicons
                                            name={item.icon}
                                            size={20}
                                            color={isActive ? colors.primary : colors.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.itemTextContainer}>
                                        <Text style={[
                                            styles.menuLabel,
                                            isActive && styles.activeMenuLabel
                                        ]}>
                                            {item.label}
                                        </Text>
                                        {item.description && (
                                            <Text style={styles.menuDescription}>{item.description}</Text>
                                        )}
                                    </View>
                                    {isActive && <View style={styles.activeIndicator} />}
                                </TouchableOpacity>
                            );
                        })}
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
                <Text style={styles.versionText}>EduLead Pro v2.0.0</Text>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
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
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    avatarGradient: {
        flex: 1,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        ...typography.h2,
        color: 'white',
        fontWeight: '800',
    },
    userInfo: {
        marginLeft: spacing.md,
        flex: 1,
    },
    userName: {
        ...typography.h3,
        color: 'white',
        fontWeight: '700',
    },
    userRole: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    headerFooter: {
        marginTop: spacing.lg,
        flexDirection: 'row',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
        marginRight: 6,
    },
    statText: {
        fontSize: 11,
        color: 'white',
        fontWeight: '600',
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
        paddingLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: 16,
        marginBottom: 4,
    },
    activeMenuItem: {
        backgroundColor: colors.surfaceHighlight,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeIconBox: {
        backgroundColor: colors.accentLight,
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
    activeMenuLabel: {
        color: colors.primary,
        fontWeight: '700',
    },
    menuDescription: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 11,
        marginTop: 1,
    },
    activeIndicator: {
        width: 4,
        height: 20,
        borderRadius: 2,
        backgroundColor: colors.accent,
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.dangerBg,
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
        ...typography.caption,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.md,
        fontSize: 10,
    },
});
