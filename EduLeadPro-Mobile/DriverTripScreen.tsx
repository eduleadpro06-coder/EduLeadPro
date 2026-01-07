import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from './services/api';
import { useOffline } from './src/hooks/useOffline';
import { offlineCache } from './src/services/offline-cache';

interface DriverTripScreenProps {
    user: any;
    onBack: () => void;
}

export default function DriverTripScreen({ user, onBack }: DriverTripScreenProps) {
    const [tripActive, setTripActive] = useState(false);
    const [tripData, setTripData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [checkedStudents, setCheckedStudents] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const { isOnline } = useOffline();

    useEffect(() => {
        loadTripData();
    }, []);

    const loadTripData = async () => {
        setLoading(true);
        try {
            const activeTrip = await api.getActiveTrip();
            if (activeTrip) {
                setTripActive(true);
                setTripData(activeTrip);
                setStudents(activeTrip.students || []);
            }
        } catch (error) {
            console.error('Failed to load trip:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTrip = async () => {
        Alert.alert(
            'Start Trip',
            'Are you sure you want to start the trip?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (isOnline) {
                                const trip = await api.startTrip();
                                setTripActive(true);
                                setTripData(trip);
                                setStudents(trip.students || []);
                                Alert.alert('Success', 'Trip started successfully');
                            } else {
                                await offlineCache.queueAction('start_trip', {});
                                Alert.alert('Queued', 'Trip start will be synced when online');
                            }
                        } catch (error) {
                            console.error('Failed to start trip:', error);
                            Alert.alert('Error', 'Failed to start trip');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const endTrip = async () => {
        Alert.alert(
            'End Trip',
            'Are you sure all students have been dropped off?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Trip',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (isOnline) {
                                await api.endTrip();
                                setTripActive(false);
                                setTripData(null);
                                setStudents([]);
                                setCheckedStudents(new Set());
                                Alert.alert('Success', 'Trip ended successfully');
                                onBack();
                            } else {
                                await offlineCache.queueAction('end_trip', {});
                                Alert.alert('Queued', 'Trip end will be synced when online');
                                onBack();
                            }
                        } catch (error) {
                            console.error('Failed to end trip:', error);
                            Alert.alert('Error', 'Failed to end trip');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const toggleStudent = (studentId: number) => {
        const newChecked = new Set(checkedStudents);
        if (newChecked.has(studentId)) {
            newChecked.delete(studentId);
        } else {
            newChecked.add(studentId);
        }
        setCheckedStudents(newChecked);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {tripActive ? 'Trip in Progress' : 'Start Trip'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView style={styles.content}>
                    {!tripActive ? (
                        /* Start Trip View */
                        <View style={styles.startView}>
                            <View style={styles.iconContainer}>
                                <Feather name="truck" size={64} color="#8B5CF6" />
                            </View>
                            <Text style={styles.startTitle}>Ready to start your route?</Text>
                            <Text style={styles.startSubtitle}>
                                Make sure you've checked the vehicle and are ready to pick up students
                            </Text>

                            <TouchableOpacity style={styles.startButton} onPress={startTrip}>
                                <Feather name="play-circle" size={24} color="#fff" />
                                <Text style={styles.startButtonText}>Start Trip</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Active Trip View */
                        <>
                            {/* Trip Info */}
                            <View style={styles.tripInfo}>
                                <View style={styles.tripInfoRow}>
                                    <Feather name="map-pin" size={20} color="#8B5CF6" />
                                    <Text style={styles.tripInfoText}>Route: {tripData?.routeName || 'Morning Route'}</Text>
                                </View>
                                <View style={styles.tripInfoRow}>
                                    <Feather name="users" size={20} color="#10B981" />
                                    <Text style={styles.tripInfoText}>
                                        {checkedStudents.size}/{students.length} students checked
                                    </Text>
                                </View>
                            </View>

                            {/* Student Checklist */}
                            <Text style={styles.sectionTitle}>Student Checklist</Text>
                            {students.map(student => {
                                const isChecked = checkedStudents.has(student.id);
                                return (
                                    <TouchableOpacity
                                        key={student.id}
                                        style={[styles.studentItem, isChecked && styles.studentItemChecked]}
                                        onPress={() => toggleStudent(student.id)}
                                    >
                                        <View style={styles.studentInfo}>
                                            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                                                {isChecked && <Feather name="check" size={16} color="#fff" />}
                                            </View>
                                            <View>
                                                <Text style={[styles.studentName, isChecked && styles.studentNameChecked]}>
                                                    {student.name}
                                                </Text>
                                                <Text style={styles.studentStop}>{student.stopName || 'Stop ' + student.stopNumber}</Text>
                                            </View>
                                        </View>
                                        {isChecked && (
                                            <View style={styles.checkedBadge}>
                                                <Text style={styles.checkedText}>Picked Up</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}

                            {/* End Trip Button */}
                            <TouchableOpacity style={styles.endButton} onPress={endTrip}>
                                <Feather name="stop-circle" size={20} color="#fff" />
                                <Text style={styles.endButtonText}>End Trip</Text>
                            </TouchableOpacity>
                        </>
                    )}
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
        backgroundColor: '#10B981'
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
        color: '#fff'
    },
    content: {
        flex: 1,
        padding: 16
    },
    startView: {
        alignItems: 'center',
        paddingTop: 60
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
    },
    startTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center'
    },
    startSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 32
    },
    startButton: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600'
    },
    tripInfo: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        gap: 12
    },
    tripInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    tripInfoText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16
    },
    studentItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    studentItemChecked: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981'
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center'
    },
    checkboxChecked: {
        backgroundColor: '#10B981',
        borderColor: '#10B981'
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827'
    },
    studentNameChecked: {
        color: '#065F46'
    },
    studentStop: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2
    },
    checkedBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    checkedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    endButton: {
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        marginBottom: 32
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
