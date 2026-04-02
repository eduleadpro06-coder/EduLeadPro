import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { colors, spacing, typography, shadows } from '../../src/theme';
import PremiumCard from '../../src/components/ui/PremiumCard';
import { StatusBar } from 'react-native';

const { width } = Dimensions.get('window');

export default function SupportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [orgDetails, setOrgDetails] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const defaultOrgName = (user as any)?.organizationName || 'EduConnect';

    React.useEffect(() => {
        const fetchOrgDetails = async () => {
            try {
                const { parentAPI } = await import('../../src/services/api');
                const details = await parentAPI.getOrganizationDetails();
                setOrgDetails(details);
            } catch (error) {
                console.error('Failed to fetch organization details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrgDetails();
    }, []);

    const orgName = orgDetails?.name || defaultOrgName;
    const phone = orgDetails?.phone || '+91 98765 43210';
    const email = orgDetails?.email && orgDetails?.email !== '' ? orgDetails.email : 'Not Available';
    const website = orgDetails?.website && orgDetails?.website !== '' ? orgDetails.website : 'Not Available';
    const address = orgDetails?.address
        ? `${orgDetails.address}${orgDetails.city ? ', ' + orgDetails.city : ''}${orgDetails.state ? ', ' + orgDetails.state : ''}${orgDetails.pincode ? ' - ' + orgDetails.pincode : ''}`
        : 'Address not available';

    const contactMethods = [
        {
            icon: 'phone-call',
            label: 'Call Us',
            value: phone,
            action: () => phone !== 'Not Available' && Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`),
            color: '#10B981'
        },
        {
            icon: 'mail',
            label: 'Email Support',
            value: email,
            action: () => email !== 'Not Available' && Linking.openURL(`mailto:${email}`),
            color: '#3B82F6'
        },
        {
            icon: 'globe',
            label: 'Visit Website',
            value: website,
            action: () => {
                if (website === 'Not Available') return;
                const url = website.startsWith('http') ? website : `https://${website}`;
                Linking.openURL(url);
            },
            color: '#8B5CF6'
        }
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={[styles.headerGradient, { paddingTop: insets.top }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Help & Support</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Hero Section */}
                <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    style={styles.heroCard}
                >
                    <View style={styles.logoCircle}>
                        <MaterialCommunityIcons name="shield-check-outline" size={32} color="#fff" />
                    </View>
                    <Text style={styles.orgName}>{orgName}</Text>
                    <Text style={styles.heroSubtitle}>Official Support Portal</Text>
                    <Text style={styles.heroDescription}>
                        We're here to help you with any questions or technical issues you might be facing.
                    </Text>
                </LinearGradient>

                {/* Contact Section */}
                <Text style={styles.sectionTitle}>Get in Touch</Text>
                <View style={styles.contactList}>
                    {contactMethods.map((method, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.contactItem}
                            onPress={method.action}
                            disabled={method.value === 'Not Available'}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: method.color + '15' }]}>
                                <Feather name={method.icon as any} size={20} color={method.color} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>{method.label}</Text>
                                <Text style={styles.contactValue}>{method.value}</Text>
                            </View>
                            {method.value !== 'Not Available' && (
                                <Feather name="chevron-right" size={18} color="#9CA3AF" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Location Card */}
                <View style={{ marginTop: 8 }}>
                    <Text style={styles.sectionTitle}>Our Office</Text>
                    <PremiumCard style={styles.locationCard}>
                        <View style={styles.locationRow}>
                            <View style={styles.locationPin}>
                                <Ionicons name="location-outline" size={24} color="#EF4444" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.locationTitle}>Office Address</Text>
                                <Text style={styles.locationAddress} numberOfLines={2}>{address}</Text>
                            </View>
                        </View>
                    </PremiumCard>
                </View>

                <View style={styles.footer} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerGradient: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        zIndex: 1,
    },
    headerTitleContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_Bold',
        color: '#fff',
    },
    content: {
        padding: 20,
    },
    heroCard: {
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        ...shadows.md,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    orgName: {
        color: '#fff',
        fontSize: 22,
        fontFamily: 'Outfit_Bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    heroSubtitle: {
        color: colors.accent, // Use accent color for portal status
        fontSize: 12,
        fontFamily: 'Lexend_SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'center',
    },
    heroDescription: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        marginLeft: 4,
    },
    contactList: {
        marginBottom: 8,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        ...shadows.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        marginLeft: 16,
    },
    contactLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '700',
    },
    locationCard: {
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#fff',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationPin: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationTitle: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '700',
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
        paddingBottom: 10,
    },
    versionText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 12,
        color: '#D1D5DB',
    },
});
