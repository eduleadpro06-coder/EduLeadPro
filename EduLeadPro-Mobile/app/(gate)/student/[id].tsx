import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
} from 'react-native';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, shadows } from '../../../src/theme';
import PremiumCard from '../../../src/components/ui/PremiumCard';
import PremiumButton from '../../../src/components/ui/PremiumButton';
import { gateAPI } from '../../../src/services/api/gate.api';

export default function StudentGateDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [status, setStatus] = useState<'checked_in' | 'checked_out'>('checked_in');
    const [pickupBy, setPickupBy] = useState<'parent' | 'authorized' | 'other'>('parent');
    const [photo, setPhoto] = useState<string | null>(null);

    useEffect(() => {
        loadStudent();
    }, [id]);

    const loadStudent = async () => {
        setLoading(true);
        try {
            const data = await gateAPI.getGateStudentDetails(id as string);
            setStudent(data);
            setStatus(data.gateStatus?.status === 'checked_out' ? 'checked_out' : 'checked_in');
        } catch (error) {
            console.error('Error loading student:', error);
            Alert.alert('Error', 'Failed to load student details');
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handleSave = async () => {
        if (status === 'checked_out' && pickupBy === 'other' && !photo) {
            Alert.alert('Photo Required', 'Please capture a photo for "Other" person pickup.');
            return;
        }

        setSubmitting(true);
        try {
            const logEntry = {
                student_id: Number(id),
                type: status === 'checked_in' ? 'check_in' : 'check_out',
                pickup_verification: status === 'checked_out' ? pickupBy : null,
                photo_url: photo,
                offline_id: `gate_${Date.now()}_${id}`,
                timestamp: new Date().toISOString()
            };

            await gateAPI.createLog(logEntry);
            Alert.alert('Success', `Student ${status === 'checked_in' ? 'Check-in' : 'Check-out'} recorded!`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message || 'Failed to save log');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!student) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Student Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.largeAvatar}>
                    <Text style={styles.avatarText}>{student.name.charAt(0)}</Text>
                </View>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentDetails}>{student.class} - {student.section}</Text>
                {student.roll_number && <Text style={styles.rollNo}>Roll No: {student.roll_number}</Text>}
            </View>

            {/* Quick Toggle Status */}
            <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Gate Status</Text>
                <View style={styles.toggleRow}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, status === 'checked_in' && styles.toggleBtnActiveIn]}
                        onPress={() => setStatus('checked_in')}
                    >
                        <MaterialIcons name="login" size={24} color={status === 'checked_in' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.toggleText, status === 'checked_in' && styles.toggleTextActive]}>Checked In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, status === 'checked_out' && styles.toggleBtnActiveOut]}
                        onPress={() => setStatus('checked_out')}
                    >
                        <MaterialIcons name="logout" size={24} color={status === 'checked_out' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.toggleText, status === 'checked_out' && styles.toggleTextActive]}>Checked Out</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Pickup Details (Visible only on Checkout) */}
            {status === 'checked_out' && (
                <View style={styles.pickupSection}>
                    <Text style={styles.sectionTitle}>Who is picking up?</Text>
                    <View style={styles.pickupGrid}>
                        {[
                            { label: 'Parent', value: 'parent', icon: 'family-restroom' },
                            { label: 'Authorized', value: 'verified', icon: 'how-to-reg' },
                            { label: 'Other', value: 'other', icon: 'person-add' },
                        ].map((item) => (
                            <TouchableOpacity 
                                key={item.value}
                                style={[styles.pickupItem, pickupBy === item.value && styles.pickupItemActive]}
                                onPress={() => setPickupBy(item.value as any)}
                            >
                                <MaterialIcons 
                                    name={item.icon as any} 
                                    size={28} 
                                    color={pickupBy === item.value ? colors.primary : colors.textSecondary} 
                                />
                                <Text style={[styles.pickupLabel, pickupBy === item.value && styles.pickupLabelActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {pickupBy === 'other' && (
                        <View style={styles.photoContainer}>
                            <Text style={styles.photoHint}>Capture photo of the person picking up the child</Text>
                            {photo ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                                    <TouchableOpacity style={styles.retakeBtn} onPress={takePhoto}>
                                        <Feather name="refresh-cw" size={16} color="#fff" />
                                        <Text style={styles.retakeText}>Retake</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.photoPlaceholder} onPress={takePhoto}>
                                    <Feather name="camera" size={32} color={colors.primary} />
                                    <Text style={styles.photoBtnText}>Capture Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.footer}>
                <PremiumButton 
                    title={submitting ? "Saving..." : `Confirm ${status === 'checked_in' ? 'Entry' : 'Exit'}`}
                    onPress={handleSave}
                    loading={submitting}
                    disabled={submitting}
                    icon={status === 'checked_in' ? 'check-circle' : 'log-out'}
                />
                <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    largeAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        ...shadows.sm,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
    },
    studentName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    studentDetails: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 2,
    },
    rollNo: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    statusSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 15,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 15,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: colors.border,
    },
    toggleBtnActiveIn: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    toggleBtnActiveOut: {
        backgroundColor: colors.danger,
        borderColor: colors.danger,
    },
    toggleText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: '#fff',
    },
    pickupSection: {
        marginBottom: 30,
    },
    pickupGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    pickupItem: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    pickupItemActive: {
        borderColor: colors.primary,
        backgroundColor: '#EEF2FF',
    },
    pickupLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 8,
    },
    pickupLabelActive: {
        color: colors.primary,
    },
    photoContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    photoHint: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 15,
    },
    photoPlaceholder: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoBtnText: {
        marginTop: 10,
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    previewContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
    },
    retakeBtn: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    retakeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    footer: {
        marginTop: 10,
    },
    cancelBtn: {
        alignItems: 'center',
        paddingVertical: 15,
        marginTop: 5,
    },
    cancelText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    }
});
