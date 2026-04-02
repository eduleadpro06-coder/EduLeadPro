/**
 * Post Update Screen - Teacher
 * Clean modal-based selection flow
 */

import React, { useState, useEffect, useMemo } from 'react';
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
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, shadows, typography } from '../../src/theme';
import PremiumButton from '../../src/components/ui/PremiumButton';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { teacherAPI } from '../../src/services/api/teacher.api';
import { StudentInfo } from '../../src/types/teacher.types';

export default function PostUpdateScreen() {
    const router = useRouter();

    // State
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [allStudents, setAllStudents] = useState<StudentInfo[]>([]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);

    // Filter & Search State (inside modal)
    const [searchQuery, setSearchQuery] = useState('');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Composition State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [activityType, setActivityType] = useState('activity');
    const [images, setImages] = useState<string[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
    const [templateSearchQuery, setTemplateSearchQuery] = useState('');

    const activityTypes = [
        { label: 'Activity', value: 'activity', icon: 'book-open' },
        { label: 'Achievement', value: 'achievement', icon: 'star' },
        { label: 'Behaviour', value: 'behaviour', icon: 'smile' },
    ];

    useEffect(() => {
        loadStudents();
        loadTemplates();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await teacherAPI.getTeacherStudents();
            setAllStudents(data);
            // Optionally, select all by default, but let's start empty for clarity.
        } catch (error) {
            console.error('Failed to load students', error);
            // Non-blocking error for UI smooth flow
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Modal
    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            return student.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [allStudents, searchQuery]);

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

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            // First filter by search query
            const matchesSearch = t.displayName.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
                t.content.toLowerCase().includes(templateSearchQuery.toLowerCase());
            
            if (!matchesSearch) return false;

            // Then filter by category if no search query is active
            // If there's a search query, show all matching results
            if (templateSearchQuery.length > 0) return true;

            // Otherwise, filter by the selected activityType
            // (Note: behavior is 'behaviour' in activityTypes but often 'behavior' in DB, handle both)
            const type = activityType === 'behaviour' ? 'behaviour' : activityType;
            return t.category === type || t.category === 'general';
        });
    }, [templates, templateSearchQuery, activityType]);

    // Selection Handlers
    const toggleStudent = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStudents.map(s => s.id));
        }
    };

    // Submission Handlers
    const handleSubmit = async () => {
        if (selectedIds.length === 0) {
            Alert.alert('Selection Required', 'Please select at least one student');
            return;
        }
        if (!content.trim()) {
            Alert.alert('Content Required', 'Please enter some details about the update');
            return;
        }

        setSubmitting(true);
        try {
            await teacherAPI.postActivity(selectedIds, content, {
                title: title.trim() || activityTypes.find(t => t.value === activityType)?.label,
                activityType,
                images,
            });

            Alert.alert('Success', 'Update posted successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to post update');
        } finally {
            setSubmitting(false);
        }
    };

    // Image Picker Handlers
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.7,
            allowsMultipleSelection: true,
            selectionLimit: 5 - images.length,
            base64: true,
        });

        if (!result.canceled) {
            const newImages = result.assets
                .filter(asset => asset.base64)
                .map(asset => `data:image/jpeg;base64,${asset.base64}`);
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImages(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
        }
    };

    const renderSelectionModal = () => (
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
            <SafeAreaView style={styles.modalSafeArea}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalHeaderBtn}>
                        <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Assign to</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalHeaderBtn}>
                        <Text style={styles.modalDoneText}>Done</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalSearchBlock}>
                    <View style={styles.modalSearchBar}>
                        <Feather name="search" size={20} color={colors.textTertiary} />
                        <TextInput
                            style={styles.modalSearchInput}
                            placeholder="Search assigned students..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={colors.textTertiary}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Feather name="x-circle" size={18} color={colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Select All Toggle */}
                <TouchableOpacity style={styles.selectAllModalRow} onPress={toggleSelectAll}>
                    <View style={[styles.checkbox, selectedIds.length === filteredStudents.length && filteredStudents.length > 0 && styles.checkboxActive]}>
                        {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 && <Feather name="check" size={14} color="#FFF" />}
                    </View>
                    <Text style={styles.selectAllTextModal}>Select All shown</Text>
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />
                ) : (
                    <ScrollView style={styles.modalList}>
                        {filteredStudents.length === 0 ? (
                            <Text style={styles.emptyModalText}>No students found</Text>
                        ) : (
                            filteredStudents.map(student => {
                                const isSelected = selectedIds.includes(student.id);
                                return (
                                    <TouchableOpacity 
                                        key={student.id} 
                                        style={styles.modalListItem}
                                        onPress={() => toggleStudent(student.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                                            {isSelected && <Feather name="check" size={14} color="#FFF" />}
                                        </View>
                                        <View style={styles.modalAvatar}>
                                            <Text style={styles.modalAvatarText}>{student.name.charAt(0)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalStudentName}>{student.name}</Text>
                                            <Text style={styles.modalStudentClass}>{student.class}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView 
                    style={{ flex: 1 }} 
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerContentInternal}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <Feather name="arrow-left" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Post Daily Update</Text>
                            <View style={{ width: 24 }} />
                        </View>
                    </LinearGradient>

                    <ScrollView 
                        style={styles.content} 
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* New Clean Selection UI */}
                        <Text style={styles.sectionTitle}>Assign To</Text>
                        <TouchableOpacity style={styles.addStudentsBtn} onPress={() => setModalVisible(true)}>
                            <View style={styles.addStudentsLeft}>
                                <View style={styles.addStudentsIconBox}>
                                    <Feather name="users" size={20} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.addStudentsTitle}>
                                        {selectedIds.length > 0 ? `${selectedIds.length} Students Selected` : 'Select Students'}
                                    </Text>
                                    <Text style={styles.addStudentsSub}>
                                        {selectedIds.length === 0 ? 'Tap to choose assigned students' : 'Tap to modify selection'}
                                    </Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>

                        {/* Selected Chips directly on the form */}
                        {selectedIds.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedChipsScroll}>
                                {allStudents.filter(s => selectedIds.includes(s.id)).map(student => (
                                    <View key={student.id} style={styles.selectedChipMain}>
                                        <Text style={styles.selectedChipTextMain}>{student.name.split(' ')[0]}</Text>
                                        <TouchableOpacity onPress={() => toggleStudent(student.id)} hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}>
                                            <Feather name="x" size={12} color="#FFF" style={{marginLeft: 4}} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                        <View style={styles.divider} />


                        {/* Update Settings */}
                        <Text style={styles.sectionTitle}>Type of Update</Text>
                        <View style={styles.typeRow}>
                            {activityTypes.map(type => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[styles.typeChip, activityType === type.value && styles.typeChipActive]}
                                    onPress={() => setActivityType(type.value)}
                                >
                                    <Feather name={type.icon as any} size={16} color={activityType === type.value ? "#FFF" : colors.textSecondary} />
                                    <Text style={[styles.typeChipText, activityType === type.value && styles.typeChipTextActive]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Composition */}
                        <PremiumCard style={styles.formCard}>
                            <Text style={styles.inputLabel}>Title (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter short title..."
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor={colors.textTertiary}
                            />

                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>Details</Text>
                                <TouchableOpacity 
                                    style={styles.templateBtn}
                                    onPress={() => setIsTemplateModalVisible(true)}
                                >
                                    <Feather name="message-square" size={14} color={colors.primary} />
                                    <Text style={styles.templateBtnText}>Templates</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                placeholder="Tell parents what the kids did today..."
                                value={content}
                                onChangeText={setContent}
                                multiline
                                numberOfLines={6}
                                placeholderTextColor={colors.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Photos ({images.length}/5)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                                {images.map((img, idx) => (
                                    <View key={idx} style={styles.imageWrapper}>
                                        <Image source={{ uri: img }} style={styles.previewImage} />
                                        <TouchableOpacity 
                                            style={styles.removeImgBtn}
                                            onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                        >
                                            <Feather name="x" size={12} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {images.length < 5 && (
                                    <TouchableOpacity style={styles.addImgBtn} onPress={() => Alert.alert('Add Photo', '', [
                                        { text: 'Gallery', onPress: pickImage },
                                        { text: 'Camera', onPress: takePhoto },
                                        { text: 'Cancel', style: 'cancel' }
                                    ])}>
                                        <Feather name="plus" size={24} color={colors.primary} />
                                        <Text style={styles.addImgText}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </PremiumCard>

                        <PremiumButton
                            title="Post Daily Update"
                            onPress={handleSubmit}
                            loading={submitting}
                            style={styles.submitBtn}
                            icon="send"
                            disabled={selectedIds.length === 0 || !content.trim()}
                        />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            {renderSelectionModal()}
            
            {/* Template Selection Modal */}
            <Modal
                visible={isTemplateModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsTemplateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContentSmall}>
                        <View style={styles.modalHeaderSmall}>
                            <Text style={styles.modalTitleSmall}>Select Template</Text>
                            <TouchableOpacity 
                                onPress={() => setIsTemplateModalVisible(false)}
                                style={styles.modalCloseBtn}
                            >
                                <Feather name="x" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.templateSearchBox}>
                            <Feather name="search" size={20} color={colors.textTertiary} />
                            <TextInput
                                style={styles.templateSearchInput}
                                placeholder="Search templates..."
                                value={templateSearchQuery}
                                onChangeText={setTemplateSearchQuery}
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <ScrollView style={styles.templateListScroll}>
                            {filteredTemplates.length > 0 ? (
                                filteredTemplates.map((template) => (
                                    <TouchableOpacity 
                                        key={template.id} 
                                        style={styles.templateItemCard}
                                        onPress={() => handleSelectTemplate(template.content)}
                                    >
                                        <Text style={styles.templateItemName}>{template.displayName}</Text>
                                        <Text style={styles.templateItemPreview} numberOfLines={2}>
                                            {template.content}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyTemplatesBox}>
                                    <Text style={styles.emptyTemplatesText}>
                                        {templateSearchQuery ? 'No matching templates' : 'No templates found'}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
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
        paddingHorizontal: 20,
        paddingTop: 15,
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
    
    // Clean Header Assignment
    addStudentsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        ...shadows.sm,
        marginBottom: 10,
    },
    addStudentsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addStudentsIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    addStudentsTitle: {
        fontSize: 16,
        fontFamily: 'Lexend_SemiBold',
        color: colors.textPrimary,
    },
    addStudentsSub: {
        fontSize: 12,
        fontFamily: 'Lexend_Regular',
        color: colors.textTertiary,
        marginTop: 2,
    },
    selectedChipsScroll: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    selectedChipMain: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },
    selectedChipTextMain: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: 'Lexend_Medium',
    },
    divider: {
        height: 1,
        backgroundColor: '#EAEAEA',
        marginVertical: 20,
    },

    // Sections
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_Bold',
        color: colors.textTertiary,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        gap: 6,
    },
    typeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeChipText: {
        fontSize: 13,
        fontFamily: 'Lexend_Medium',
        color: colors.textSecondary,
    },
    typeChipTextActive: {
        color: '#FFF',
    },
    formCard: {
        padding: 15,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontFamily: 'Lexend_SemiBold',
        color: colors.textTertiary,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        fontFamily: 'Lexend_Regular',
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 20,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    templateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    templateBtnText: {
        color: colors.primary,
        fontSize: 13,
        fontFamily: 'Lexend_SemiBold',
    },
    imageScroll: {
        marginTop: 5,
    },
    imageWrapper: {
        marginRight: 12,
    },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removeImgBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImgBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary + '05',
    },
    addImgText: {
        fontSize: 11,
        color: colors.primary,
        fontFamily: 'Lexend_Medium',
        marginTop: 2,
    },
    submitBtn: {
        marginTop: 10,
    },

    // Modal Styles
    modalSafeArea: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalHeaderBtn: {
        padding: 5,
    },
    modalCancelText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontFamily: 'Lexend_Regular',
    },
    modalDoneText: {
        fontSize: 16,
        color: colors.primary,
        fontFamily: 'Lexend_SemiBold',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    modalSearchBlock: {
        padding: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    modalSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    modalSearchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        fontFamily: 'Lexend_Regular',
        color: colors.textPrimary,
    },
    selectAllModalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#CCC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    selectAllTextModal: {
        fontSize: 15,
        fontFamily: 'Lexend_Medium',
        color: colors.textPrimary,
    },
    modalList: {
        flex: 1,
    },
    modalListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F9F9',
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalAvatarText: {
        color: colors.primary,
        fontSize: 16,
        fontFamily: 'Outfit_Bold',
    },
    modalStudentName: {
        fontSize: 15,
        fontFamily: 'Lexend_Medium',
        color: colors.textPrimary,
    },
    modalStudentClass: {
        fontSize: 13,
        fontFamily: 'Lexend_Regular',
        color: colors.textTertiary,
    },
    emptyModalText: {
        textAlign: 'center',
        marginTop: 40,
        fontFamily: 'Lexend_Medium',
        color: '#BBB',
        fontSize: 15,
    },

    // Template Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContentSmall: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '70%',
        padding: 20,
    },
    modalHeaderSmall: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitleSmall: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: colors.textPrimary,
    },
    modalCloseBtn: {
        padding: 5,
    },
    templateSearchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 15,
    },
    templateSearchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontFamily: 'Lexend_Regular',
        color: colors.textPrimary,
    },
    templateListScroll: {
        flex: 1,
    },
    templateItemCard: {
        padding: 16,
        backgroundColor: '#FCFCFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: 10,
    },
    templateItemName: {
        fontSize: 15,
        fontFamily: 'Lexend_SemiBold',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    templateItemPreview: {
        fontSize: 13,
        fontFamily: 'Lexend_Regular',
        color: colors.textSecondary,
        lineHeight: 18,
    },
    emptyTemplatesBox: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTemplatesText: {
        fontSize: 14,
        color: colors.textTertiary,
        fontFamily: 'Lexend_Medium',
    }
});
