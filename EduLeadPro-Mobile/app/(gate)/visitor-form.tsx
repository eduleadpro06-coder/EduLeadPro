import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, shadows } from '../../src/theme';
import PremiumButton from '../../src/components/ui/PremiumButton';
import { gateAPI } from '../../src/services/api/gate.api';

export default function VisitorFormScreen() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    
    // Form fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [purpose, setPurpose] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required.');
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
        if (!name.trim() || !phone.trim() || !purpose.trim()) {
            Alert.alert('Missing Fields', 'Please enter Name, Phone and Purpose of visit.');
            return;
        }

        setSubmitting(true);
        try {
            const visitorData = {
                name: name.trim(),
                phone: phone.trim(),
                purpose: purpose.trim(),
                photo_url: photo,
                entry_time: new Date().toISOString()
            };

            await gateAPI.visitorCheckIn(visitorData);
            Alert.alert('Success', 'Visitor check-in log saved!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Visitor save error:', error);
            Alert.alert('Error', error.message || 'Failed to save log');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.formCard}>
                <Text style={styles.label}>Visitor Name</Text>
                <View style={styles.inputContainer}>
                    <Feather name="user" size={20} color={colors.textSecondary} />
                    <TextInput 
                        style={styles.input}
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputContainer}>
                    <Feather name="phone" size={20} color={colors.textSecondary} />
                    <TextInput 
                        style={styles.input}
                        placeholder="9876543210"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                <Text style={styles.label}>Purpose of Visit</Text>
                <View style={styles.inputContainer}>
                    <Feather name="info" size={20} color={colors.textSecondary} />
                    <TextInput 
                        style={[styles.input, { height: 80, paddingTop: 10 }]}
                        placeholder="Meeting with Principal / Maintenance"
                        multiline
                        value={purpose}
                        onChangeText={setPurpose}
                    />
                </View>

                <Text style={styles.label}>Capture ID / Photo</Text>
                <View style={styles.photoSection}>
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
            </View>

            <View style={styles.footer}>
                <PremiumButton 
                    title={submitting ? "Processing..." : "Save Visitor Entry"}
                    onPress={handleSave}
                    loading={submitting}
                    disabled={submitting}
                />
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
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        ...shadows.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
    },
    input: {
        flex: 1,
        height: 45,
        marginLeft: 10,
        fontSize: 15,
        color: colors.textPrimary,
    },
    photoSection: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        overflow: 'hidden',
    },
    photoPlaceholder: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
    },
    photoBtnText: {
        marginTop: 10,
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    previewContainer: {
        height: 200,
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
        marginTop: 30,
        marginBottom: 20,
    }
});
