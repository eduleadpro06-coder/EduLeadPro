import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    SafeAreaView
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';

export default function MyStudentsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);
        } catch (error) {
            console.error('Students load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Feather name="arrow-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Students</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search students..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSecondary + '80'}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStudents} />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>{filteredStudents.length} Students Assigned</Text>
                        {filteredStudents.map(student => (
                            <PremiumCard key={student.id} style={styles.studentCard}>
                                <View style={styles.avatarBox}>
                                    <Text style={styles.avatarText}>{student.name?.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentClass}>{student.class}</Text>
                                </View>
                                <TouchableOpacity style={styles.detailsBtn}>
                                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </PremiumCard>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginTop: -25,
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        ...shadows.md,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        fontFamily: 'Lexend_Regular',
        color: colors.textPrimary,
    },
    content: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingTop: 0 },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
        marginBottom: 16,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    avatarBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: colors.primary,
    },
    studentName: {
        fontSize: 16,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    studentClass: {
        fontSize: 12,
        fontFamily: 'Lexend_Regular',
        color: colors.textSecondary,
    },
    detailsBtn: {
        padding: 4,
    }
});
