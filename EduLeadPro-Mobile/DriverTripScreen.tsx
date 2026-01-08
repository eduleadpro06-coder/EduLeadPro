import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    Platform,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { api, type Child } from './services/api';
import { colors, spacing, typography, shadows, layout } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumButton from './src/components/ui/PremiumButton';
import { useLanguage } from './src/hooks/LanguageContext';

interface DriverTripScreenProps {
    route: { id: string; name: string };
    students?: any[];
    onTripEnd: () => void;
}

export default function DriverTripScreen({ route, students: initialStudents, onTripEnd }: DriverTripScreenProps) {
    const { t } = useLanguage();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        if (initialStudents) {
            setStudents(initialStudents.map(s => ({
                id: s.id,
                name: s.name,
                stop: s.class || 'Pickup', // Or some other reasonable fallback
                status: 'pending'
            })));
            setLoading(false);
        } else {
            // Fallback just in case
            setStudents([]);
            setLoading(false);
        }

        // Start Location Tracking & Send to Backend
        const interval = setInterval(async () => {
            try {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                setLocation(loc);

                // Real-time update to backend
                await api.updateBusLocation(
                    parseInt(route.id),
                    loc.coords.latitude,
                    loc.coords.longitude,
                    loc.coords.speed || 0,
                    loc.coords.heading || 0
                );
            } catch (err) {
                console.warn('Location update failed', err);
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [initialStudents]);

    const onUpdateStatus = (studentId: number, newStatus: 'pending' | 'boarded' | 'dropped') => {
        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, status: newStatus } : s
        ));
    };

    const toggleStatus = async (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        let nextStatus: 'pending' | 'boarded' | 'dropped' = 'pending';
        if (student.status === 'pending') nextStatus = 'boarded';
        else if (student.status === 'boarded') nextStatus = 'dropped';
        else if (student.status === 'dropped') nextStatus = 'pending';

        try {
            // Assuming route.id is the tripSessionId
            await api.updateStudentTripStatus(studentId, parseInt(route.id), parseInt(route.id), nextStatus);
            onUpdateStatus(studentId, nextStatus);
        } catch (error) {
            console.error('Failed to update student status:', error);
            // Optionally update UI anyway to be responsive, or show error
            onUpdateStatus(studentId, nextStatus);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'boarded': return colors.success;
            case 'dropped': return colors.info;
            default: return colors.warning; // pending
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'boarded': return 'check-circle';
            case 'dropped': return 'home';
            default: return 'clock';
        }
    };

    const handleEndTrip = () => {
        Alert.alert(
            t('end_trip_title'),
            t('end_trip_confirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('end_trip_btn'), style: 'destructive', onPress: onTripEnd }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.danger, '#991b1b']} // Red for "Live Action" awareness
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <View style={styles.liveTag}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>{t('live_tracking')}</Text>
                            </View>
                            <Text style={styles.routeTitle}>{route.name}</Text>
                        </View>
                        <TouchableOpacity onPress={handleEndTrip} style={styles.closeBtn}>
                            <Feather name="x" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.infoBar}>
                <Text style={styles.infoText}>{t('routes')}: <Text style={{ fontWeight: '700' }}>{route.name}</Text></Text>
                <Text style={styles.infoText}>{students.filter(s => s.status === 'boarded').length} {t('onboard')}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <PremiumCard style={styles.studentCard}>
                            <View style={styles.studentRow}>
                                <View style={styles.avatar}>
                                    <Feather name="user" size={20} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentName}>{item.name}</Text>
                                    <Text style={styles.stopName}>{item.stop}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.statusBtn, { backgroundColor: getStatusColor(item.status) + '20' }]}
                                    onPress={() => toggleStatus(item.id)}
                                >
                                    <Feather name={getStatusIcon(item.status) as any} size={20} color={getStatusColor(item.status)} />
                                    <Text style={[styles.statusLabel, { color: getStatusColor(item.status) }]}>
                                        {t(item.status as any)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </PremiumCard>
                    )}
                />
            )}

            <View style={styles.footer}>
                <PremiumButton
                    title={t('complete_trip')}
                    variant="danger"
                    size="lg"
                    onPress={handleEndTrip}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { height: 140, marginBottom: 0 },
    headerGradient: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    routeTitle: { ...typography.h2, color: 'white', fontSize: 22 },
    closeBtn: { padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20 },

    liveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    liveText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

    infoBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
    infoText: { ...typography.body, fontWeight: '600' },

    studentCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
    studentRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceHighlight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
    studentName: { ...typography.body, fontWeight: '700' },
    stopName: { ...typography.caption },

    statusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    statusLabel: { fontSize: 11, fontWeight: '700', marginLeft: 6 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, ...shadows.lg },
});
