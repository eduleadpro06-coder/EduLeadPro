import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function ActivityDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Parse activity data from params
    const activity = params.activity ? JSON.parse(params.activity as string) : null;

    if (!activity) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Activity' }} />
                <Text>Activity not found</Text>
            </View>
        );
    }

    const hasImage = (activity.mediaUrls && activity.mediaUrls.length > 0) ||
        (activity.media_urls && activity.media_urls.length > 0) ||
        activity.image;

    // Normalize media list
    const mediaList = activity.mediaUrls || activity.media_urls || (activity.image ? [activity.image] : []) || [];

    const date = activity.postedAt ? new Date(activity.postedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Just now';

    // Helper for type styling
    const getTypeConfig = (type: string) => {
        const normalizedType = type?.toLowerCase() || 'general';
        switch (normalizedType) {
            case 'achievement': return { color: '#F59E0B', bg: '#FEF3C7', label: 'Achievement', icon: 'star' };
            case 'wellness': return { color: '#EC4899', bg: '#FCE7F3', label: 'Wellness', icon: 'heart' };
            default: return { color: '#059669', bg: '#ECFDF5', label: 'Daily Update', icon: 'sun' };
        }
    };

    const typeKey = activity.activityType || activity.activity_type || activity.type || 'general';
    const typeConfig = getTypeConfig(typeKey);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Header / Carousel */}
                {hasImage ? (
                    <View style={styles.carouselContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={(e) => {
                                const offset = e.nativeEvent.contentOffset.x;
                                const index = Math.round(offset / width);
                            }}
                            scrollEventThrottle={16}
                        >
                            {mediaList.map((url: string, index: number) => (
                                <View key={index} style={styles.imageHeader}>
                                    {/* Blurred Background for immersive feel */}
                                    <Image
                                        source={{ uri: url }}
                                        style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}
                                        resizeMode="cover"
                                        blurRadius={30}
                                    />
                                    {/* Dark gradient to ensure text/back button visibility */}
                                    <LinearGradient
                                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
                                        style={StyleSheet.absoluteFill}
                                    />

                                    {/* Main Image - Full visibility */}
                                    <Image
                                        source={{ uri: url }}
                                        style={styles.mainImage}
                                        resizeMode="contain"
                                    />

                                    {mediaList.length > 1 && (
                                        <View style={styles.photoCountBadge}>
                                            <Text style={styles.photoCountText}>{index + 1} / {mediaList.length}</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : (
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        style={[styles.imageHeader, { height: 250 }]}
                    >
                        <MaterialCommunityIcons name="image-off" size={48} color="rgba(255,255,255,0.2)" />
                    </LinearGradient>
                )}

                {/* Back Button Overlay */}
                <TouchableOpacity
                    style={[styles.backButton, { top: insets.top + 10 }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Content */}
                <View style={[styles.infoContainer, !hasImage && { marginTop: -20 }]}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                            <Feather name={typeConfig.icon as any} size={14} color={typeConfig.color} />
                            <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                        </View>
                        <Text style={styles.dateText}>{date}</Text>
                    </View>

                    <Text style={styles.title}>{activity.title}</Text>

                    <View style={styles.authorRow}>
                        <View style={styles.avatar}>
                            <Feather name="user" size={16} color="#6B7280" />
                        </View>
                        <Text style={styles.authorName}>Posted by {activity.teacherName || 'Class Teacher'}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.contentBody}>{activity.content}</Text>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    imageHeader: {
        width: width,
        height: height * 0.55,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    carouselContainer: {
        width: width,
        height: height * 0.55,
    },
    photoCountBadge: {
        position: 'absolute',
        bottom: 45,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    photoCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    infoContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        padding: 24,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    typeBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    typeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dateText: {
        color: '#6B7280',
        fontSize: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        lineHeight: 32,
        marginBottom: 16,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    authorName: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    contentBody: {
        fontSize: 16,
        lineHeight: 26,
        color: '#374151',
    },
    subTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginTop: 32,
        marginBottom: 16,
    },
    mediaGrid: {
        marginTop: 10,
    },
    gridRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridImage: {
        width: (width - 60) / 2,
        height: 120,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
});
