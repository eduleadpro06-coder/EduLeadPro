import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
// @ts-ignore
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export default function CustomDrawerContent(props: any) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const insets = useSafeAreaInsets();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const isTeacher = user?.role === 'teacher';
    const isSecurity = user?.role === 'security' || user?.role === 'support_staff' || user?.role === 'care giver';
    
    const teacherItems = [
        { label: 'Dashboard', icon: 'home', route: '/(teacher)' },
        { label: 'My Tasks', icon: 'clipboard', route: '/(teacher)/tasks' },
        { label: 'Apply Leave', icon: 'calendar', route: '/(teacher)/leaves' },
        { label: 'Mark Attendance', icon: 'check-square', route: '/(teacher)/mark-attendance' },
        { label: 'Post Activity', icon: 'camera', route: '/(teacher)/post-update' },
        { label: 'My Students', icon: 'users', route: '/(teacher)' },
    ];

    const parentItems = [
        { label: 'Dashboard', icon: 'home', route: '/(parent)' },
        { label: 'Bus Tracking', icon: 'truck', route: '/(parent)/bus-tracking' },
        { label: 'Fees', icon: 'credit-card', route: '/(parent)/fees' },
        { label: 'Activities', icon: 'calendar', route: '/(parent)/activities' },
        { label: 'Chat', icon: 'message-circle', route: '/(parent)/chat' },
    ];

    const securityItems = [
        { label: 'Gate Dashboard', icon: 'shield', route: '/(gate)' },
        { label: 'QR Scanner', icon: 'maximize', route: '/(gate)/scanner' },
        { label: 'Visitor Log', icon: 'user-plus', route: '/(gate)/visitor-form' },
        { label: 'Entry Logs', icon: 'list', route: '/(gate)/history' },
    ];

    const menuItems = isSecurity ? securityItems : (isTeacher ? teacherItems : parentItems);

    return (
        <View style={{ flex: 1 }}>
            {/* Header */}
            <LinearGradient
                colors={['#111827', '#1F2937']}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.profileRow}>
                    <View style={styles.avatarContainer}>
                        <Feather name="user" size={32} color="#111827" />
                    </View>
                    <View style={{ marginLeft: 16 }}>
                        <Text style={styles.userName}>{user?.name || (isSecurity ? 'Gate Security' : isTeacher ? 'Teacher' : 'Parent')}</Text>
                        <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'USER'}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Drawer Items */}
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => {
                        const isActive = pathname === item.route;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => router.push(item.route as any)}
                                style={[
                                    styles.menuItem,
                                    isActive && styles.menuItemActive
                                ]}
                            >
                                <View style={[styles.iconBox, isActive && { backgroundColor: '#FFA50040' }]}>
                                    <Feather
                                        name={item.icon as any}
                                        size={20}
                                        color={isActive ? '#D97706' : '#6B7280'}
                                    />
                                </View>
                                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Feather name="log-out" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 24,
        paddingBottom: 32,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    userRole: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 1,
    },
    drawerContent: {
        paddingTop: 10,
    },
    menuContainer: {
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
    },
    menuItemActive: {
        backgroundColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBox: {
        marginRight: 16,
    },
    menuText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    menuTextActive: {
        color: '#111827',
        fontWeight: '600',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoutText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
        marginLeft: 12,
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
