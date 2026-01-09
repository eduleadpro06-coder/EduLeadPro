import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    KeyboardAvoidingView,
    TextInput
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { api, type Child } from './services/api';
import { colors, spacing, typography, shadows, layout } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumButton from './src/components/ui/PremiumButton';
import PremiumInput from './src/components/ui/PremiumInput';

interface ActivityScreenProps {
    onBack?: () => void;
}

export default function TeacherActivityScreen({ onBack }: ActivityScreenProps) {
    const [students, setStudents] = useState<Child[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [activityType, setActivityType] = useState('Learning');
    const [mood, setMood] = useState('Happy');
    const [searchQuery, setSearchQuery] = useState('');

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraVisible, setCameraVisible] = useState(false);
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCamera = () => {
        if (!permission?.granted) {
            requestPermission();
            return;
        }
        setCameraVisible(true);
    };

    const handleGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setCapturedPhoto(result.assets[0].uri);
        }
    };

    const takePicture = async () => {
        if (cameraRef) {
            try {
                const photo = await cameraRef.takePictureAsync({ quality: 0.7 });
                setCapturedPhoto(photo?.uri || null);
                setCameraVisible(false);
            } catch (error) {
                Alert.alert('Error', 'Could not take photo');
            }
        }
    };

    const toggleStudent = (studentId: number) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setSelectedStudentIds(newSet);
    };

    const selectAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        }
    };

    const handleSubmit = async () => {
        if (selectedStudentIds.size === 0) {
            Alert.alert('No Students Selected', 'Please select at least one student');
            return;
        }

        if (!title || !description) {
            Alert.alert('Incomplete', 'Please fill title and description');
            return;
        }

        setUploading(true);
        try {
            let mediaUrls: string[] = [];
            if (capturedPhoto) {
                // Determine mime type
                const uriParts = capturedPhoto.split('.');
                const fileType = uriParts[uriParts.length - 1];
                const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';

                const formData = new FormData();
                // @ts-ignore
                formData.append('file', {
                    uri: capturedPhoto,
                    name: `upload.${fileType}`,
                    type: mimeType
                });

                const uploadRes = await api.uploadMedia(formData);
                if (uploadRes && uploadRes.url) {
                    mediaUrls.push(uploadRes.url);
                }
            }

            // Post activity to each selected student
            const promises = Array.from(selectedStudentIds).map(studentId =>
                api.postActivity(studentId, {
                    type: activityType,
                    title,
                    content: description,
                    mood: mood,
                    mediaUrls
                })
            );

            await Promise.all(promises);

            Alert.alert('Success', `Activity posted to ${selectedStudentIds.size} student(s)!`, [
                { text: 'OK', onPress: () => onBack?.() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to post activity');
        } finally {
            setUploading(false);
        }
    };

    if (cameraVisible) {
        return (
            <View style={styles.cameraContainer}>
                <CameraView style={{ flex: 1 }} ref={(ref) => setCameraRef(ref)} />

                {/* Overlay Controls */}
                <View style={StyleSheet.absoluteFillObject}>
                    <View style={styles.cameraHeader}>
                        <TouchableOpacity onPress={() => setCameraVisible(false)} style={styles.closeBtn}>
                            <Feather name="x" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cameraFooter}>
                        <TouchableOpacity onPress={takePicture} style={styles.captureBtn}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Post</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>

                {/* Media Section */}
                {capturedPhoto ? (
                    <View style={styles.mediaPreview}>
                        <Image source={{ uri: capturedPhoto }} style={styles.mediaImage} />
                        <TouchableOpacity style={styles.removeMedia} onPress={() => setCapturedPhoto(null)}>
                            <Feather name="x" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.mediaSelector}>
                        <TouchableOpacity style={styles.mediaBtn} onPress={handleCamera}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.infoBg }]}>
                                <Feather name="camera" size={24} color={colors.info} />
                            </View>
                            <Text style={styles.mediaLabel}>Camera</Text>
                        </TouchableOpacity>
                        <View style={styles.mediaDivider} />
                        <TouchableOpacity style={styles.mediaBtn} onPress={handleGallery}>
                            <View style={[styles.iconCircle, { backgroundColor: colors.warningBg }]}>
                                <Feather name="image" size={24} color={colors.warning} />
                            </View>
                            <Text style={styles.mediaLabel}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: spacing.lg }} />

                {/* Form */}
                <PremiumInput
                    label="Title"
                    placeholder="e.g. Art Class Masterpiece"
                    value={title}
                    onChangeText={setTitle}
                />

                <PremiumInput
                    label="Description"
                    placeholder="Describe the moment..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
                />

                {/* Student Selector (Vertical List with Search) */}
                <View style={styles.studentSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.label}>Select Students ({selectedStudentIds.size} selected)</Text>
                        <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
                            <Text style={styles.selectAllText}>
                                {selectedStudentIds.size === students.length ? 'Deselect All' : 'Select All'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={16} color={colors.textSecondary} />
                        <TextInput
                            placeholder="Search students..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.searchInput}
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    {/* Student List */}
                    <ScrollView style={styles.studentListContainer} nestedScrollEnabled>
                        {students
                            .filter(s => searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                            .map(student => {
                                const isSelected = selectedStudentIds.has(student.id);
                                return (
                                    <TouchableOpacity
                                        key={student.id}
                                        style={styles.studentListItem}
                                        onPress={() => toggleStudent(student.id)}
                                    >
                                        <View style={[styles.studentCheckbox, isSelected && styles.studentCheckboxSelected]}>
                                            {isSelected && <Feather name="check" size={14} color="white" />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.studentListName}>{student.name}</Text>
                                            <Text style={styles.studentListClass}>{student.class}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                    </ScrollView>
                </View>

                {/* Mood Selector */}
                <Text style={styles.label}>Mood</Text>
                <View style={styles.moodRow}>
                    {['Happy', 'Focused', 'Creative', 'Sleepy', 'Excited'].map(m => {
                        const isSelected = mood === m;
                        return (
                            <TouchableOpacity
                                key={m}
                                style={[styles.moodChip, isSelected && { borderColor: colors.accent, backgroundColor: colors.accentLight }]}
                                onPress={() => setMood(m)}
                            >
                                <Text style={{ fontSize: 12, color: isSelected ? colors.accent : colors.textSecondary }}>{m}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                <View style={{ height: spacing.xl }} />

                <PremiumButton
                    title="Share Update"
                    onPress={handleSubmit}
                    loading={uploading}
                />

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: spacing.md, backgroundColor: colors.background },
    headerTitle: { ...typography.h3 },
    backBtn: { padding: 8 },

    cameraContainer: { flex: 1, backgroundColor: 'black' },
    cameraHeader: { position: 'absolute', top: 50, left: 20 },
    closeBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
    cameraFooter: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },

    mediaSelector: { flexDirection: 'row', borderRadius: spacing.borderRadius.lg, backgroundColor: colors.surface, padding: spacing.lg, ...shadows.sm, justifyContent: 'space-around', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border },
    mediaBtn: { alignItems: 'center', width: 100 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    mediaLabel: { ...typography.caption, fontWeight: '600' },
    mediaDivider: { width: 1, height: '80%', backgroundColor: colors.border },

    mediaPreview: { height: 250, borderRadius: spacing.borderRadius.lg, overflow: 'hidden', ...shadows.md },
    mediaImage: { width: '100%', height: '100%' },
    removeMedia: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 15 },

    label: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
    studentSection: { marginTop: 16 },
    selectAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: colors.primary,
        borderRadius: 6,
    },
    selectAllText: {
        fontSize: 11,
        color: 'white',
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.textPrimary,
        padding: 0,
    },
    studentListContainer: {
        maxHeight: 200,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    studentListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    studentCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentCheckboxSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    studentListName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    studentListClass: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    chipRow: { flexDirection: 'row', marginBottom: 8 },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surfaceHighlight,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipCheckbox: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipCheckboxSelected: {
        backgroundColor: 'white',
        borderColor: 'white',
    },
    chipText: { fontSize: 13, color: colors.textSecondary },
    chipTextSelected: { color: colors.textInverted, fontWeight: '600' },

    moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    moodChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
