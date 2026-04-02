/**
 * Attendance History Screen - Teacher
 * Allows teachers to view past attendance records for a specific student
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    ActivityIndicator,
    FlatList,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { api } from '../../src/services/api';

// Helper to format date
const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper for status color
const getStatusColor = (status: string) => {
    switch (status) {
        case 'present': return colors.success;
        case 'late': return colors.warning;
        case 'absent': return colors.danger;
        default: return colors.textTertiary;
    }
};

export default function AttendanceHistoryScreen() {
    const router = useRouter();

    // State
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);

    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showStudentPicker, setShowStudentPicker] = useState(false);

    const getInitials = (name: string) => {
        if (!name) return 'S';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getAvatarColor = (id: number) => {
        const colors_list = ['#643ae5', '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];
        const index = typeof id === 'number' ? id : 0;
        return colors_list[index % colors_list.length];
    };

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            loadHistory(selectedStudent.id);
        }
    }, [selectedStudent]);

    const loadStudents = async () => {
        setLoadingStudents(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students', error);
            Alert.alert('Error', 'Failed to load student list');
        } finally {
            setLoadingStudents(false);
        }
    };

    const loadHistory = async (studentId: number) => {
        setLoadingHistory(true);
        try {
            const response = await api.getAttendanceHistory(studentId, 30);
            setHistory(response.data || []);
        } catch (error) {
            console.error('Failed to load history', error);
            Alert.alert('Error', 'Failed to load attendance history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const renderStudentPicker = () => (
        <Modal
            visible={showStudentPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowStudentPicker(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowStudentPicker(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.modalContent}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Student</Text>
                        <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
                            <Feather name="x" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {loadingStudents ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : (
                            students.map(student => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setSelectedStudent(student);
                                        setShowStudentPicker(false);
                                    }}
                                >
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: getAvatarColor(student.id) + '20' }]}>
                                        <Text style={{ fontSize: 13, color: getAvatarColor(student.id), fontFamily: 'Outfit_Bold' }}>
                                            {getInitials(student.name)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.pickerItemText}>{student.name}</Text>
                                        <Text style={styles.pickerItemSubText}>{student.class}</Text>
                                    </View>
                                    {selectedStudent?.id === student.id && (
                                        <Feather name="check" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );

    const renderHistoryItem = ({ item }: { item: any }) => (
        <View style={styles.historyItem}>
            <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                {item.check_in_time && (
                    <Text style={styles.timeText}>
                        {new Date(item.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContentInternal}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Attendance History</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.content}>
                {/* Student Selector - Horizontal List */}
                <View style={{ marginBottom: spacing.md }}>
                    <Text style={styles.sectionLabel}>Select Student</Text>
                    <FlatList
                        horizontal
                        data={students}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => {
                            const isSelected = selectedStudent?.id === item.id;
                            const avatarColor = getAvatarColor(item.id);
                            return (
                                <TouchableOpacity
                                    style={[styles.avatarItem, isSelected && styles.avatarItemSelected]}
                                    onPress={() => setSelectedStudent(item)}
                                >
                                    <View style={[
                                        styles.avatarCircle, 
                                        isSelected ? { backgroundColor: avatarColor, borderColor: avatarColor } : { borderColor: '#F3F4F6' }
                                    ]}>
                                        <Text style={{ 
                                            fontSize: 16, 
                                            color: isSelected ? '#FFF' : avatarColor, 
                                            fontFamily: 'Outfit_Bold' 
                                        }}>
                                            {getInitials(item.name)}
                                        </Text>
                                    </View>
                                    <Text style={[styles.avatarName, isSelected && { color: avatarColor, fontWeight: '700' }]} numberOfLines={1}>
                                        {item.name.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* History List */}
                <View style={{ flex: 1, marginTop: spacing.md }}>
                    <Text style={styles.sectionLabel}>Recent Records</Text>

                    {loadingHistory ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : !selectedStudent ? (
                        <View style={styles.centered}>
                            <Feather name="arrow-up" size={48} color={colors.textTertiary + '40'} />
                            <Text style={styles.emptyText}>Select a student from the list above</Text>
                        </View>
                    ) : history.length === 0 ? (
                        <View style={styles.centered}>
                            <Feather name="calendar" size={48} color={colors.textTertiary + '40'} />
                            <Text style={styles.emptyText}>No attendance records found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={history}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ paddingBottom: spacing.xl }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>

            {renderStudentPicker()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContentInternal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_Bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_SemiBold',
        color: colors.textSecondary,
        marginBottom: 12,
        marginTop: 4,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.md,
    },
    selectorValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    selectorSubValue: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    selectorPlaceholder: {
        fontSize: 16,
        color: colors.textTertiary,
    },

    // Avatar Horizontal List
    avatarItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 64,
    },
    avatarItemSelected: {
        transform: [{ scale: 1.05 }],
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarName: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },

    // List Items
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateContainer: {
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    timeText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Loading/Empty
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
        fontSize: 16,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    pickerItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    pickerItemSubText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    }
});
