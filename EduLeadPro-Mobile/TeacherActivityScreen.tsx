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
    KeyboardAvoidingView
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
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [activityType, setActivityType] = useState('Learning');
    const [mood, setMood] = useState('Happy');

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
            if (data.length > 0) setSelectedStudentId(data[0].id);
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

    const handleSubmit = async () => {
        if (!selectedStudentId || !title || !description) {
            Alert.alert('Incomplete', 'Please fill all required fields');
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

            await api.postActivity(selectedStudentId, {
                type: activityType,
                title,
                content: description,
                mood: mood,
                mediaUrls
            });

            Alert.alert('Success', 'Activity posted to timeline!', [
                { text: 'OK', onPress: () => onBack?.() }
            ]);
        } catch (error) {
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

                {/* Student Selector (Chips) */}
                <Text style={styles.label}>Tag Student</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {students.map(student => {
                        const isSelected = selectedStudentId === student.id;
                        return (
                            <TouchableOpacity
                                key={student.id}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => setSelectedStudentId(student.id)}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {student.name.split(' ')[0]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

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
    chipRow: { flexDirection: 'row', marginBottom: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceHighlight, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textSecondary },
    chipTextSelected: { color: colors.textInverted, fontWeight: '600' },

    moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    moodChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
});
