import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';

export default function MenuScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const menuItems = [
        { icon: 'grid-outline', label: 'Dashboard', route: '/(teacher)/dashboard' },
        { icon: 'calendar-outline', label: 'Mark Attendance', route: '/(teacher)/attendance' },
        { icon: 'create-outline', label: 'Post Update', route: '/(teacher)/activity' },
        { icon: 'people-outline', label: 'My Students', route: '/(teacher)/students' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.header}
            >
                <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        <Text style={styles.userRole}>Teacher</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => router.push(item.route as any)}
                    >
                        <Ionicons name={item.icon as any} size={24} color="#4B5563" />
                        <Text style={styles.menuItemText}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevron} />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        padding: 24,
        paddingTop: 48,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    menuContainer: {
        flex: 1,
        padding: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItemText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    chevron: {
        marginLeft: 8,
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
    },
});
