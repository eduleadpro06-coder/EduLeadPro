/**
 * Post Update Screen
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import teacherAPI from '../../services/api/teacher.api';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const ACTIVITY_TYPES = [
    { id: 'lunch', label: 'Lunch', icon: '🍽️' },
    { id: 'play', label: 'Play Time', icon: '⚽' },
    { id: 'study', label: 'Study', icon: '📚' },
    { id: 'nap', label: 'Nap Time', icon: '😴' },
    { id: 'art', label: 'Art & Craft', icon: '🎨' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'other', label: 'Other', icon: '📝' },
];

interface Student {
    id: number;
    name: string;
    class: string;
}

export default function PostUpdateScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        if (!user?.userId) return;

        try {
            setLoading(true);
            const dashboard = await teacherAPI.getDashboard(user.userId);
            setStudents(dashboard.students || []);
        } catch (error) {
            console.error('Failed to load students:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudent = (studentId: number) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudentIds(newSelected);
    };

    const selectAll = () => {
        if (selectedStudentIds.size === students.length) {
            // Deselect all
            setSelectedStudentIds(new Set());
        } else {
            // Select all
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        }
    };

    const handlePost = async () => {
        if (!selectedActivity) {
            Alert.alert('Required', 'Please select an activity type');
            return;
        }

        if (!content.trim()) {
            Alert.alert('Required', 'Please enter update content');
            return;
        }

        if (selectedStudentIds.size === 0) {
            Alert.alert('Required', 'Please select at least one student');
            return;
        }

        if (!user?.organizationId || !user?.name) return;

        try {
            setPosting(true);

            await teacherAPI.postDailyUpdate({
                leadIds: Array.from(selectedStudentIds),
                activityType: selectedActivity,
                content: content.trim(),
                teacherName: user.name,
                organizationId: user.organizationId,
            });

            Alert.alert(
                'Success',
                `Update posted to ${selectedStudentIds.size} student(s)`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Failed to post update:', error);
            Alert.alert('Error', error.message || 'Failed to post update');
        } finally {
            setPosting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Daily Update</Text>
                <View style={{ width: 60 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.content}>
                    {/* Activity Type Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Activity Type *</Text>
                        <View style={styles.activityGrid}>
                            {ACTIVITY_TYPES.map((activity) => (
                                <TouchableOpacity
                                    key={activity.id}
                                    style={[
                                        styles.activityCard,
                                        selectedActivity === activity.id && styles.activityCardActive,
                                    ]}
                                    onPress={() => setSelectedActivity(activity.id)}
                                >
                                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                                    <Text
                                        style={[
                                            styles.activityLabel,
                                            selectedActivity === activity.id && styles.activityLabelActive,
                                        ]}
                                    >
                                        {activity.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Student Selection */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                Select Students * ({selectedStudentIds.size} selected)
                            </Text>
                            <TouchableOpacity onPress={selectAll} style={styles.selectAllButton}>
                                <Text style={styles.selectAllButtonText}>
                                    {selectedStudentIds.size === students.length ? 'Deselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.studentList}>
                            {students.map((student) => (
                                <TouchableOpacity
                                    key={student.id}
                                    style={[
                                        styles.studentItem,
                                        selectedStudentIds.has(student.id) && styles.studentItemSelected,
                                    ]}
                                    onPress={() => toggleStudent(student.id)}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        selectedStudentIds.has(student.id) && styles.checkboxSelected
                                    ]}>
                                        {selectedStudentIds.has(student.id) && (
                                            <Text style={styles.checkmark}>✓</Text>
                                        )}
                                    </View>
                                    <View style={styles.studentDetails}>
                                        <Text style={styles.studentName}>{student.name}</Text>
                                        <Text style={styles.studentClassText}>Class {student.class}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Update Content *</Text>
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Describe the activity or share observations..."
                            placeholderTextColor={colors.text.light}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                        <Text style={styles.hint}>
                            This update will be shared with selected students' parents
                        </Text>
                    </View>
                </ScrollView>
            )}

            {/* Post Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.postButton, posting && styles.postButtonDisabled]}
                    onPress={handlePost}
                    disabled={posting || loading}
                >
                    {posting ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <Text style={styles.postButtonText}>Post Update</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    backButton: {
        paddingVertical: spacing.sm,
    },
    backButtonText: {
        fontSize: typography.fontSize.xl,
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
    headerTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    selectAllButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
    },
    selectAllButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    activityGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    activityCard: {
        width: '31%',
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.cardBorder,
    },
    activityCardActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    activityIcon: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    activityLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        textAlign: 'center',
        fontWeight: typography.fontWeight.medium,
    },
    activityLabelActive: {
        color: colors.primary,
    },
    studentList: {
        gap: spacing.sm,
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 2,
        borderColor: colors.cardBorder,
    },
    studentItemSelected: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}10`,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: borderRadius.sm,
        borderWidth: 2,
        borderColor: colors.cardBorder,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    checkboxSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    checkmark: {
        fontSize: 16,
        color: colors.white,
        fontWeight: typography.fontWeight.bold,
    },
    studentDetails: {
        flex: 1,
    },
    studentName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
    },
    studentClassText: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        marginTop: 2,
    },
    contentInput: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        minHeight: 120,
    },
    hint: {
        fontSize: typography.fontSize.xs,
        color: colors.text.light,
        marginTop: spacing.sm,
    },
    footer: {
        padding: spacing.lg,
        backgroundColor: colors.white,
        ...shadows.sm,
    },
    postButton: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    postButtonDisabled: {
        opacity: 0.6,
    },
    postButtonText: {
        color: colors.white,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
    },
});
