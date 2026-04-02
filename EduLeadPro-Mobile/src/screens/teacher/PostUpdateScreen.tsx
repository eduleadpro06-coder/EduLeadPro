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
    Modal,
    FlatList,
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
    section?: string;
}

export default function PostUpdateScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    const [templates, setTemplates] = useState<any[]>([]);
    const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');

    useEffect(() => {
        loadStudents();
        loadTemplates();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredStudents(students);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = students.filter(s => 
                s.name.toLowerCase().includes(query) ||
                (s.class && s.class.toLowerCase().includes(query)) ||
                (s.section && s.section.toLowerCase().includes(query))
            );
            setFilteredStudents(filtered);
        }
    }, [searchQuery, students]);

    const loadStudents = async () => {
        if (!user?.userId) return;

        try {
            setLoading(true);
            const teacherStudents = await teacherAPI.getTeacherStudents();
            setStudents(teacherStudents || []);
            setFilteredStudents(teacherStudents || []);
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
        const allFilteredIds = filteredStudents.map(s => s.id);
        const allFilteredSelected = allFilteredIds.every(id => selectedStudentIds.has(id));

        const newSelected = new Set(selectedStudentIds);
        if (allFilteredSelected) {
            allFilteredIds.forEach(id => newSelected.delete(id));
        } else {
            allFilteredIds.forEach(id => newSelected.add(id));
        }
        setSelectedStudentIds(newSelected);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getAvatarColor = (id: number) => {
        const colors_list = ['#643ae5', '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0'];
        return colors_list[id % colors_list.length];
    };

    const loadTemplates = async () => {
        try {
            const data = await teacherAPI.getTemplates();
            setTemplates(data || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const handleSelectTemplate = (templateContent: string) => {
        setContent(templateContent);
        setIsTemplateModalVisible(false);
        setTemplateSearchQuery('');
    };

    const filteredTemplates = templates.filter(t => 
        t.displayName.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(templateSearchQuery.toLowerCase())
    );

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
                <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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
                            {filteredStudents.length > 0 && (
                                <TouchableOpacity onPress={selectAll} style={styles.selectAllToggle}>
                                    <Text style={styles.selectAllToggleText}>
                                        {filteredStudents.every(s => selectedStudentIds.has(s.id)) ? 'Deselect All' : 'Select All'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search assigned students..."
                                placeholderTextColor={colors.text.light}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity 
                                    onPress={() => setSearchQuery('')}
                                    style={styles.clearSearch}
                                >
                                    <Text style={styles.clearSearchText}>×</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.studentList}>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <TouchableOpacity
                                        key={student.id}
                                        style={[
                                            styles.studentItem,
                                            selectedStudentIds.has(student.id) && styles.studentItemSelected,
                                        ]}
                                        onPress={() => toggleStudent(student.id)}
                                    >
                                        <View style={[styles.avatar, { backgroundColor: getAvatarColor(student.id) }]}>
                                            <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
                                        </View>
                                        <View style={styles.studentDetails}>
                                            <Text style={styles.studentName}>{student.name}</Text>
                                            <Text style={styles.studentClassText}>Class {student.class}</Text>
                                        </View>
                                        <View style={[
                                            styles.checkboxCircle,
                                            selectedStudentIds.has(student.id) && styles.checkboxCircleSelected
                                        ]}>
                                            {selectedStudentIds.has(student.id) && (
                                                <Text style={styles.checkmarkIcon}>✓</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>
                                        {searchQuery ? "No matching students found" : "No students assigned to you"}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Update Content *</Text>
                            <TouchableOpacity 
                                onPress={() => setIsTemplateModalVisible(true)}
                                style={styles.templatesButton}
                            >
                                <Text style={styles.templatesButtonText}>💬 Templates</Text>
                            </TouchableOpacity>
                        </View>
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

                    {/* Template Selection Modal */}
                    <Modal
                        visible={isTemplateModalVisible}
                        animationType="slide"
                        transparent={true}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Select Template</Text>
                                    <TouchableOpacity 
                                        onPress={() => setIsTemplateModalVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Template Search */}
                                <View style={styles.templateSearchContainer}>
                                    <TextInput
                                        style={styles.templateSearchInput}
                                        placeholder="Search templates..."
                                        placeholderTextColor={colors.text.light}
                                        value={templateSearchQuery}
                                        onChangeText={setTemplateSearchQuery}
                                    />
                                </View>

                                <FlatList
                                    data={filteredTemplates}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={styles.templateItem}
                                            onPress={() => handleSelectTemplate(item.content)}
                                        >
                                            <Text style={styles.templateName}>{item.displayName}</Text>
                                            <Text style={styles.templatePreview} numberOfLines={2}>
                                                {item.content}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <View style={styles.modalEmptyState}>
                                            <Text style={styles.modalEmptyText}>
                                                {templateSearchQuery ? 'No matching templates' : 'No templates available'}
                                            </Text>
                                        </View>
                                    }
                                    contentContainerStyle={styles.templateList}
                                />
                            </View>
                        </View>
                    </Modal>
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
    selectAllToggle: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    selectAllToggleText: {
        color: colors.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
        paddingVertical: spacing.sm,
    },
    clearSearch: {
        padding: spacing.xs,
    },
    clearSearchText: {
        fontSize: 20,
        color: colors.text.light,
        fontWeight: 'bold',
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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.white,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    checkboxCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.cardBorder,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    checkboxCircleSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    checkmarkIcon: {
        fontSize: 14,
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
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: typography.fontSize.md,
        color: colors.text.light,
        textAlign: 'center',
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
    templatesButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: `${colors.primary}10`,
        borderRadius: borderRadius.sm,
    },
    templatesButtonText: {
        color: colors.primary,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '80%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    closeButton: {
        padding: spacing.xs,
    },
    closeButtonText: {
        fontSize: 24,
        color: colors.text.light,
    },
    templateSearchContainer: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    templateSearchInput: {
        height: 48,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
    },
    templateList: {
        paddingBottom: spacing.xl,
    },
    templateItem: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    templateName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: 4,
    },
    templatePreview: {
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
    },
    modalEmptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalEmptyText: {
        fontSize: typography.fontSize.md,
        color: colors.text.light,
    },
});
