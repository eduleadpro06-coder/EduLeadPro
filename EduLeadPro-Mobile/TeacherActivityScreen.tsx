import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import { useOffline } from './src/hooks/useOffline';
import { offlineCache } from './src/services/offline-cache';

interface ActivityScreenProps {
    onBack: () => void;
}

export default function TeacherActivityScreen({ onBack }: ActivityScreenProps) {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
    const [activityContent, setActivityContent] = useState('');
    const [activityType, setActivityType] = useState('learning');
    const [activityMood, setActivityMood] = useState('happy');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showStudentPicker, setShowStudentPicker] = useState(false);
    const { isOnline } = useOffline();

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getTeacherStudents('');
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students:', error);
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const submitActivity = async () => {
        if (!selectedStudent || !activityContent.trim()) {
            Alert.alert('Validation', 'Please select a student and enter activity details');
            return;
        }

        setSubmitting(true);
        try {
            if (isOnline) {
                await api.postActivity(selectedStudent, activityContent, {
                    activityType,
                    mood: activityMood
                });
                Alert.alert('Success', 'Activity posted successfully');
            } else {
                await offlineCache.queueAction('post_activity', {
                    leadId: selectedStudent,
                    content: activityContent,
                    options: { activityType, mood: activityMood }
                });
                Alert.alert('Queued', 'Activity will be synced when online');
            }

            // Reset form
            setSelectedStudent(null);
            setActivityContent('');
            setActivityType('learning');
            setActivityMood('happy');
            onBack();
        } catch (error) {
            console.error('Failed to post activity:', error);
            Alert.alert('Error', 'Failed to post activity');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedStudentData = students.find(s => s.id === selectedStudent);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Activity</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView style={styles.content}>
                    {/* Student Selector */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Select Student</Text>
                        <TouchableOpacity
                            style={styles.picker}
                            onPress={() => setShowStudentPicker(!showStudentPicker)}
                        >
                            <Text style={[styles.pickerText, !selectedStudent && styles.placeholderText]}>
                                {selectedStudentData ? selectedStudentData.name : 'Choose a student...'}
                            </Text>
                            <Feather name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>

                        {showStudentPicker && (
                            <View style={styles.studentPicker}>
                                {students.map(student => (
                                    <TouchableOpacity
                                        key={student.id}
                                        style={styles.studentOption}
                                        onPress={() => {
                                            setSelectedStudent(student.id);
                                            setShowStudentPicker(false);
                                        }}
                                    >
                                        <Text style={styles.studentOptionText}>{student.name}</Text>
                                        <Text style={styles.studentOptionClass}>{student.class}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Activity Type */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Activity Type</Text>
                        <View style={styles.buttonGroup}>
                            {[
                                { value: 'learning', icon: 'book', label: 'Learning' },
                                { value: 'meal', icon: 'coffee', label: 'Meal' },
                                { value: 'nap', icon: 'moon', label: 'Nap' },
                                { value: 'play', icon: 'smile', label: 'Play' }
                            ].map(type => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.optionButton,
                                        activityType === type.value && styles.optionButtonActive
                                    ]}
                                    onPress={() => setActivityType(type.value)}
                                >
                                    <Feather
                                        name={type.icon as any}
                                        size={18}
                                        color={activityType === type.value ? '#fff' : '#6B7280'}
                                    />
                                    <Text style={[
                                        styles.optionButtonText,
                                        activityType === type.value && styles.optionButtonTextActive
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Mood Selector */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mood</Text>
                        <View style={styles.buttonGroup}>
                            {[
                                { value: 'happy', emoji: '😊', label: 'Happy' },
                                { value: 'neutral', emoji: '😐', label: 'Neutral' },
                                { value: 'sad', emoji: '😢', label: 'Sad' }
                            ].map(mood => (
                                <TouchableOpacity
                                    key={mood.value}
                                    style={[
                                        styles.moodButton,
                                        activityMood === mood.value && styles.moodButtonActive
                                    ]}
                                    onPress={() => setActivityMood(mood.value)}
                                >
                                    <Text style={styles.emojiText}>{mood.emoji}</Text>
                                    <Text style={[
                                        styles.moodLabel,
                                        activityMood === mood.value && styles.moodLabelActive
                                    ]}>
                                        {mood.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Activity Description */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Activity Description</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="What did the student do today?"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={4}
                            value={activityContent}
                            onChangeText={setActivityContent}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={submitActivity}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Feather name="send" size={18} color="#fff" />
                                <Text style={styles.submitButtonText}>Post Activity</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    content: {
        flex: 1,
        padding: 16
    },
    formGroup: {
        marginBottom: 24
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8
    },
    picker: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pickerText: {
        fontSize: 16,
        color: '#111827'
    },
    placeholderText: {
        color: '#9CA3AF'
    },
    studentPicker: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginTop: 8,
        maxHeight: 200
    },
    studentOption: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    studentOptionText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    studentOptionClass: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2
    },
    buttonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    optionButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#fff'
    },
    optionButtonActive: {
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6'
    },
    optionButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500'
    },
    optionButtonTextActive: {
        color: '#fff'
    },
    moodButton: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        backgroundColor: '#fff'
    },
    moodButtonActive: {
        borderColor: '#8B5CF6',
        backgroundColor: '#F3E8FF'
    },
    emojiText: {
        fontSize: 32,
        marginBottom: 4
    },
    moodLabel: {
        fontSize: 12,
        color: '#6B7280'
    },
    moodLabelActive: {
        color: '#8B5CF6',
        fontWeight: '600'
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top'
    },
    submitButton: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 32
    },
    submitButtonDisabled: {
        opacity: 0.6
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
