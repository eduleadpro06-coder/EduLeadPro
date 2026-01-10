/**
 * Post Update Screen - Teacher
 * Allows teachers to post daily activity updates for multiple students with images
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Platform,
    Modal,
    ActivityIndicator,
    Image,
    StatusBar,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import PremiumButton from '../../src/components/ui/PremiumButton';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { api } from '../../src/services/api';

export default function PostUpdateScreen() {
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState<any[]>([]);

    // Form State
    const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [activityType, setActivityType] = useState('activity');
    const [images, setImages] = useState<string[]>([]); // Changed to array

    // Dropdown State
    const [showStudentPicker, setShowStudentPicker] = useState(false);

    const activityTypes = [
        { label: 'Activity', value: 'activity', icon: 'book-open' },
        { label: 'Achievement', value: 'achievement', icon: 'star' },
        { label: 'Behaviour', value: 'behaviour', icon: 'smile' },
    ];

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students', error);
            Alert.alert('Error', 'Failed to load student list');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.7,
                allowsMultipleSelection: true,
                selectionLimit: 5,
                base64: true,
            });

            if (!result.canceled) {
                const newImages = result.assets
                    .filter(asset => asset.base64)
                    .map(asset => `data:image/jpeg;base64,${asset.base64}`);

                setImages(prev => [...prev, ...newImages]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Refused", "You need to allow camera access to take photos.");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setImages(prev => [...prev, base64Img]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const handleSubmit = async () => {
        if (selectedStudents.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one student');
            return;
        }
        if (!content.trim()) {
            Alert.alert('Content Required', 'Please enter some details about the update');
            return;
        }

        setSubmitting(true);
        try {
            const leadIds = selectedStudents.map(s => s.id);
            await api.postActivity(leadIds, content, {
                title: title.trim() || getDefaultTitle(),
                activityType: activityType,
                images: images, // Pass array of base64 images
                image: images.length > 0 ? images[0] : null // Legacy support
            });

            Alert.alert('Success', 'Update posted successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Post update error:', error);
            Alert.alert('Error', error.message || 'Failed to post update');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStudentSelection = (student: any) => {
        if (selectedStudents.find(s => s.id === student.id)) {
            setSelectedStudents(prev => prev.filter(s => s.id !== student.id));
        } else {
            setSelectedStudents(prev => [...prev, student]);
        }
    };

    // Template State
    const [showTemplates, setShowTemplates] = useState(false);
    const templatesByType: Record<string, string[]> = {
        activity: [
            "We learned about Photosynthesis today through a fun experiment.",
            "The class enjoyed a storytelling session about history.",
            "Students participated in a group art project using recycled materials.",
            "We practiced multiplication tables with a fun interactive game.",
            "Today's science class focused on local ecosystems.",
            "Introduced new vocabulary words related to nature."
        ],
        achievement: [
            "Awarded 'Star Student' for excellent participation today!",
            "Completed the reading challenge ahead of schedule!",
            "Shown remarkable improvement in handwriting.",
            "Helped a classmate today - great display of kindness.",
            "Scored full marks in the surprise quiz.",
            "Demonstrated great leadership skills in group activities."
        ],
        behaviour: [
            "Showed great discipline during the morning assembly.",
            "Was very attentive and focused in class today.",
            "Needs to work on active listening skills during lessons.",
            "Displayed positive leadership qualities in group tasks.",
            "Please ensure homework is completed on time.",
            "Was very polite and respectful to teachers and peers."
        ]
    };

    const currentTemplates = templatesByType[activityType] || templatesByType['activity'];

    const selectAllStudents = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents([...students]);
        }
    };

    const handleTemplateSelect = (template: string) => {
        setContent(template);
        setShowTemplates(false);
    };

    const renderTemplateModal = () => (
        <Modal
            visible={showTemplates}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTemplates(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '60%' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Templates: {activityTypes.find(t => t.value === activityType)?.label}</Text>
                        <TouchableOpacity onPress={() => setShowTemplates(false)}>
                            <Feather name="x" size={24} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                        {currentTemplates.map((template, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.templateItem}
                                onPress={() => handleTemplateSelect(template)}
                            >
                                <Text style={styles.templateText}>{template}</Text>
                                <Feather name="chevron-right" size={16} color={colors.text.light} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    const getDefaultTitle = () => {
        const typeObj = activityTypes.find(t => t.value === activityType);
        return typeObj ? typeObj.label : 'Activity Update';
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderStudentList = () => (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.sectionLabel}>Who is this for?</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setShowSearch(!showSearch);
                            if (showSearch) setSearchQuery('');
                        }}
                        style={{ marginLeft: 12, padding: 4 }}
                    >
                        <Feather name={showSearch ? "x-circle" : "search"} size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={selectAllStudents}>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                        {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                    </Text>
                </TouchableOpacity>
            </View>

            {showSearch && (
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search student..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.text.light}
                    autoFocus
                />
            )}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 2, gap: 12 }}
            >
                {filteredStudents.length === 0 ? (
                    <Text style={{ color: colors.text.secondary, fontStyle: 'italic', padding: 8 }}>No students found</Text>
                ) : (
                    filteredStudents.map(student => {
                        const isSelected = !!selectedStudents.find(s => s.id === student.id);
                        return (
                            <TouchableOpacity
                                key={student.id}
                                style={{ alignItems: 'center', width: 64 }}
                                onPress={() => toggleStudentSelection(student)}
                            >
                                <View style={[
                                    styles.avatarRing,
                                    isSelected && styles.avatarRingActive
                                ]}>
                                    <View style={[
                                        styles.inlineAvatar,
                                        isSelected && styles.inlineAvatarActive
                                    ]}>
                                        <Feather name="user" size={20} color={isSelected ? colors.white : colors.text.secondary} />
                                    </View>
                                    {isSelected && (
                                        <View style={styles.checkmarkBadge}>
                                            <Feather name="check" size={10} color={colors.white} />
                                        </View>
                                    )}
                                </View>
                                <Text numberOfLines={1} style={[
                                    styles.studentNameCompact,
                                    isSelected && styles.studentNameActive
                                ]}>
                                    {student.name ? student.name.split(' ')[0] : 'Student'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Summary Text */}
            <Text style={styles.selectionSummary}>
                {selectedStudents.length === 0
                    ? 'Select students above'
                    : `${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} selected`}
            </Text>
        </View>
    );

    const handleImageAction = () => {
        Alert.alert('Upload Photo', 'Choose a source', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Gallery', onPress: pickImage },
            { text: 'Camera', onPress: takePhoto },
        ]);
    };

    const renderTypePicker = () => (
        <View style={styles.typeListContent}>
            {activityTypes.map(type => (
                <TouchableOpacity
                    key={type.value}
                    style={[
                        styles.typeChip,
                        { flex: 1, justifyContent: 'center' },
                        activityType === type.value && styles.typeChipActive
                    ]}
                    onPress={() => setActivityType(type.value)}
                >
                    <Feather
                        name={type.icon as any}
                        size={16}
                        color={activityType === type.value ? colors.white : colors.text.secondary}
                    />
                    <Text style={[
                        styles.typeLabel,
                        activityType === type.value && styles.typeLabelActive
                    ]} numberOfLines={1}>
                        {type.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Post Daily Update</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardDismissMode="on-drag"
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* Student Selection (Inline) */}
                        <PremiumCard style={styles.sectionCard}>
                            {students.length > 0 ? renderStudentList() : (
                                <ActivityIndicator color={colors.primary} />
                            )}
                        </PremiumCard>

                        {/* Activity Type Card (Horizontal Scroll) */}
                        <View style={{ marginTop: spacing.md }}>
                            <Text style={[styles.sectionLabel, { marginLeft: 4 }]}>Type of Update</Text>
                            {renderTypePicker()}
                        </View>

                        {/* Content Card */}
                        <PremiumCard style={[styles.sectionCard, { marginTop: spacing.md }]}>
                            <Text style={styles.sectionLabel}>Title (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={getDefaultTitle()}
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor={colors.text.light}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: 8 }}>
                                <Text style={styles.sectionLabel}>Details</Text>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => setShowTemplates(true)}
                                >
                                    <Feather name="message-square" size={14} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginLeft: 4 }}>Templates</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Enter details about the activity or event..."
                                value={content}
                                onChangeText={setContent}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                placeholderTextColor={colors.text.light}
                            />

                            {/* Image Upload Area */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                                <Text style={styles.sectionLabel}>Photos ({images.length}/5)</Text>
                                {images.length > 0 && (
                                    <TouchableOpacity onPress={() => setImages([])}>
                                        <Text style={{ fontSize: 12, color: colors.danger, fontWeight: '600' }}>Clear All</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
                                {images.map((img, index) => (
                                    <View key={index} style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: img }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImageBtn}
                                            onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            <Feather name="x" size={14} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {images.length < 5 && (
                                    <TouchableOpacity style={styles.uploadBox} onPress={handleImageAction}>
                                        <Feather name="plus" size={24} color={colors.primary} />
                                        <Text style={styles.uploadBoxText}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </PremiumCard>

                        {/* Submit Button */}
                        <View style={{ marginTop: spacing.xl }}>
                            <PremiumButton
                                title={`Post Update to ${selectedStudents.length || 0} Student${selectedStudents.length !== 1 ? 's' : ''}`}
                                onPress={handleSubmit}
                                loading={submitting}
                                icon="send"
                                disabled={selectedStudents.length === 0 || !content.trim()}
                            />
                            {selectedStudents.length === 0 && (
                                <Text style={styles.hintText}>
                                    Select at least one student to post
                                </Text>
                            )}
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>

                {renderTemplateModal()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    backButton: {
        padding: 8,
        marginLeft: -8
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text.primary,
    },
    content: {
        padding: spacing.md,
        paddingBottom: 40
    },
    sectionCard: {
        marginBottom: 8,
        padding: 10
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
        marginBottom: 4,
    },

    // Inline Student List
    avatarRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.cardBorder,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4
    },
    avatarRingActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary
    },
    inlineAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
    },
    inlineAvatarActive: {
        backgroundColor: colors.primary
    },
    checkmarkBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white
    },
    studentNameCompact: {
        fontSize: 13,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: 4
    },
    studentNameActive: {
        color: colors.primary,
        fontWeight: '600'
    },
    selectionSummary: {
        fontSize: 12,
        color: colors.text.light,
        marginTop: 12,
        marginLeft: 4,
        fontStyle: 'italic'
    },

    // Input
    input: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 10,
        fontSize: 15,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        minHeight: 40,
    },
    textArea: {
        minHeight: 80,
        paddingTop: 10,
    },

    // Horizontal Type List
    typeListContent: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 2,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        marginRight: 4,
    },
    typeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeLabel: {
        marginLeft: 8,
        fontSize: 13,
        fontWeight: '600',
        color: colors.text.secondary,
    },
    typeLabelActive: {
        color: colors.white,
    },

    // Simplified Image Upload
    imageUploadContainer: {
        marginTop: 4,
    },
    uploadBtnRefined: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderRadius: 10,
        borderStyle: 'dashed',
        marginBottom: 8,
        justifyContent: 'center'
    },
    uploadBtnTextRefined: {
        marginLeft: 8,
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600'
    },
    // Multi Image Styles
    imagePreviewContainer: {
        width: 100,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    uploadBox: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
    },
    uploadBoxText: {
        fontSize: 12,
        color: colors.primary,
        marginTop: 4,
        fontWeight: '600'
    },

    // Hint
    hintText: {
        textAlign: 'center',
        marginTop: 8,
        color: colors.text.light,
        fontSize: 12
    },

    // Modal - No longer used but key kept if needed for other things
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: spacing.md,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    templateItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    templateText: {
        fontSize: 14,
        color: colors.text.primary,
        flex: 1,
        marginRight: 10,
        lineHeight: 20
    },
    searchInput: {
        backgroundColor: colors.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: colors.text.primary,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    modalSubtitle: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 1,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
    },
    pickerItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text.primary,
    },
    pickerItemSubText: {
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: 1,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.text.light,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12
    }
});
