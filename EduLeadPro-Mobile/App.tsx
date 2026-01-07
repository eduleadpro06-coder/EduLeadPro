import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { api, type Child, type DailyUpdate, type Attendance, type Announcement } from './services/api';
import LoginScreen from './LoginScreen';
import BusScreen from './BusScreen';
import ActivitiesScreen from './ActivitiesScreen';
import MessagesScreen from './MessagesScreen';
import TeacherHomeScreen from './TeacherHomeScreen';
import DriverHomeScreen from './DriverHomeScreen';

const { width } = Dimensions.get('window');

// Premium Color Palette
const colors = {
  primary: '#2D7A5F',
  primaryDark: '#1F5A45',
  primaryLight: '#4ADE80',
  white: '#FFFFFF',
  background: '#F0FDF4', // Light mint bg
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  cardBg: '#FFFFFF',
  iconBg: '#F3F4F6',
};

// Mock data (fallback)
const mockData = {
  parent: {
    child: {
      name: 'Student',
      photo: 'user',
      class: 'Nursery A',
      batch: 'Morning',
      status: 'Active',
      checkInTime: '09:00 AM',
    },
    todayActivity: {
      title: 'Art & Craft Session',
      description: 'Creating beautiful paintings using watercolors. Creativity and focus.',
      teacher: 'Ms. Priya Patel',
      time: '2 hours ago',
    },
    busStatus: {
      isLive: true,
      busNumber: 'MH 12 AB 1234',
      location: 'Near City Mall',
      eta: '15 mins',
    },
  },
};

// ... imports ...

function App() {
  const [fontsLoaded] = useFonts({
    'Feather': Platform.OS === 'web'
      ? { uri: 'https://cdn.jsdelivr.net/npm/@expo/vector-icons@13.0.0/build/vendor/react-native-vector-icons/Fonts/Feather.ttf' }
      : require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
  });

  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'bus' | 'activities' | 'messages' | 'emergency'>('home');
  const [showEmergency, setShowEmergency] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [latestActivity, setLatestActivity] = useState<DailyUpdate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('user_session');
        if (sessionData) {
          const { user: savedUser, students } = JSON.parse(sessionData);
          setUser(savedUser);
          setChildren(students);
          // Only fetch parent data for parents, not for teachers/drivers
          if (savedUser.role === 'parent' && students.length > 0) {
            fetchLiveData(students[0].id, savedUser.organization_id);
          }
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setIsLoadingSession(false);
      }
    };
    loadSession();
  }, []);

  const fetchLiveData = async (childId: number, organizationId: number) => {
    if (!childId || !organizationId) return;
    try {
      // Parallel fetching using v1 API
      const [annRes, attRes, updRes] = await Promise.all([
        api.getAnnouncements(organizationId),
        api.getTodayAttendance(childId),
        api.getDailyUpdates(childId)
      ]);
      setAnnouncements(annRes);
      setTodayAttendance(attRes);
      if (updRes.length > 0) {
        setLatestActivity(updRes[0]);
      }
    } catch (e) {
      console.error('Failed to fetch live data', e);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (user && children.length > 0) {
      await fetchLiveData(children[0].id, user.organization_id);
    }
    setIsRefreshing(false);
  };

  // Use the first child from login response
  const realChild = children.length > 0 ? children[0] : null;

  const displayedChild = realChild ? {
    name: realChild.name,
    photo: 'user', // Default icon
    class: realChild.class || 'N/A',
    batch: 'Standard',
    status: realChild.status || 'Active',
    checkInTime: todayAttendance?.checkInTime || 'Not checked in'
  } : mockData.parent.child;

  if (!fontsLoaded || isLoadingSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleLoginSuccess = async (loggedInUser: any, students: any[]) => {
    setUser(loggedInUser);
    setChildren(students);
    // Only fetch parent data for parents, not for teachers/drivers
    if (loggedInUser.role === 'parent' && students.length > 0) {
      fetchLiveData(students[0].id, loggedInUser.organization_id);
    }
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify({ user: loggedInUser, students }));
    } catch (e) {
      console.error('Failed to save session', e);
    }
  };

  const handleLogout = async () => {
    setUser(null);
    setChildren([]);
    setActiveTab('home');
    try {
      // Clear JWT tokens
      await api.clearTokens();
      // Clear session
      await AsyncStorage.removeItem('user_session');
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  };

  // Handle role-based routing
  if (!user) {
    return (
      <LoginScreen onLoginSuccess={handleLoginSuccess} />
    );
  }

  // DEBUG: Log user and role to verify routing
  console.log('🔍 ROUTING CHECK - User:', JSON.stringify(user, null, 2));
  console.log('🔍 User Role:', user.role);
  console.log('🔍 Is Teacher?', user.role === 'teacher');
  console.log('🔍 Is Driver?', user.role === 'driver');

  // Route Teachers to Teacher Dashboard
  if (user.role === 'teacher') {
    console.log('✅ Routing to TeacherHomeScreen');
    return <TeacherHomeScreen user={user} onLogout={handleLogout} />;
  }

  // Route Drivers to Driver Dashboard
  if (user.role === 'driver') {
    console.log('✅ Routing to DriverHomeScreen');
    return <DriverHomeScreen user={user} onLogout={handleLogout} />;
  }

  console.log('⚠️ Defaulting to Parent UI');
  // Parent UI continues below (existing code)

  // Emergency Screen
  if (showEmergency) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[colors.danger, '#991B1B']}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setShowEmergency(false)} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Emergency & Alerts</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Emergency Status */}
          <View style={styles.section}>
            <View style={styles.emergencyStatusCard}>
              <View style={styles.emergencyIconLarge}>
                <Feather name="alert-circle" size={32} color={colors.danger} />
                <View style={[styles.pulseDot, { backgroundColor: colors.danger }]} />
              </View>
              <View style={styles.emergencyStatusContent}>
                <Text style={styles.cardLabel}>Current Status</Text>
                <Text style={[styles.cardTitle, { color: colors.danger, fontSize: 22 }]}>Wait for Updates</Text>
                <Text style={styles.cardTime}>Last updated: Just now</Text>
              </View>
            </View>
          </View>

          {/* Emergency Contacts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <View style={styles.grid}>
              {[
                { title: 'School Office', sub: 'Reception', icon: 'phone', color: colors.success, bg: '#D1FAE5' },
                { title: 'Emergency', sub: '911 / Police', icon: 'shield', color: colors.danger, bg: '#FEE2E2' },
                { title: 'Principal', sub: 'Dr. Rajesh', icon: 'user', color: colors.warning, bg: '#FEF3C7' },
                { title: 'Teacher', sub: 'Ms. Priya', icon: 'book', color: '#3B82F6', bg: '#DBEAFE' }
              ].map((item, index) => (
                <TouchableOpacity key={index} style={[styles.gridCard, { backgroundColor: item.bg }]}>
                  <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                    <Feather name={item.icon as any} size={24} color="white" />
                  </View>
                  <Text style={styles.gridTitle}>{item.title}</Text>
                  <Text style={styles.gridSub}>{item.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alert Feed */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="bell" size={18} color={colors.danger} />
                  <Text style={[styles.cardTitle, { fontSize: 16 }]}>Pickup Alert</Text>
                </View>
                <Text style={styles.cardTime}>Yesterday</Text>
              </View>
              <Text style={styles.cardDesc}>
                Please ensure to pick up your child by 2:00 PM due to early dispersal.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main Dashboard
  return (
    <View style={styles.rootContainer}>
      <View style={styles.appFrame}>
        <StatusBar barStyle="light-content" />

        {/* Modern Minimalist Header Bar (Global) */}
        <View style={styles.topToolbar}>
          <View style={{ width: 44 }}>
            <Feather name="menu" size={22} color={colors.textPrimary} />
          </View>
          <View style={styles.toolbarCenter}>
            {user.organizationName ? (
              <Text style={styles.toolbarOrgName}>{user.organizationName}</Text>
            ) : (
              <Text style={styles.toolbarOrgName}>EduLead Pro</Text>
            )}
          </View>
          <View style={styles.toolbarActions}>
            <TouchableOpacity style={styles.toolbarIconBtn} onPress={handleLogout}>
              <Feather name="log-out" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarIconBtn}>
              <Feather name="bell" size={22} color={colors.textPrimary} />
              <View style={styles.toolbarBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.scrollContent}>
          {activeTab === 'home' && (
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

              {/* Main Greeting Section */}
              <View style={styles.greetingHeader}>
                <View>
                  <Text style={styles.welcomeSub}>Welcome back,</Text>
                  <Text style={styles.welcomeTitle}>{user.name || 'Parent'} 👋</Text>
                </View>
              </View>

              {/* Child Profile Card */}
              <View style={styles.profileSection}>
                <View style={styles.profileCard}>
                  <View style={styles.profileRow}>
                    <View style={styles.avatarContainer}>
                      <Feather name="user" size={32} color={colors.primary} />
                    </View>
                    <View style={styles.profileInfo}>
                      <Text style={styles.studentName}>{displayedChild.name}</Text>
                      <Text style={styles.studentDetails}>{displayedChild.class} • {displayedChild.batch}</Text>
                      <View style={styles.statusPill}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{displayedChild.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Stats Grid */}
              <View style={styles.section}>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                      <Feather name="check" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Attendance</Text>
                      <Text style={styles.statValue}>Present</Text>
                    </View>
                  </View>
                  <View style={styles.statCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Feather name="clock" size={20} color={colors.warning} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Check-in</Text>
                      <Text style={styles.statValue}>{displayedChild.checkInTime}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* School Announcements */}
              {announcements.length > 0 && (
                <View style={[styles.section, { marginBottom: 20 }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Announcements</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {announcements.map((ann) => (
                      <View key={ann.id} style={[styles.announcementCard, { width: width * 0.7 }]}>
                        <LinearGradient
                          colors={['#4F46E5', '#7C3AED']}
                          style={styles.announcementGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Feather name="bell" size={20} color="#FFF" style={{ marginBottom: 8 }} />
                          <Text style={styles.announcementTitle} numberOfLines={1}>{ann.title}</Text>
                          <Text style={styles.announcementDesc} numberOfLines={2}>{ann.content}</Text>
                        </LinearGradient>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Latest Activity */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Latest Activity</Text>
                  <TouchableOpacity onPress={() => setActiveTab('activities')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                {latestActivity ? (
                  <View style={styles.activityCard}>
                    {latestActivity.mediaUrls && latestActivity.mediaUrls.length > 0 ? (
                      <Image
                        source={{ uri: latestActivity.mediaUrls[0] }}
                        style={styles.activityImage}
                      />
                    ) : (
                      <View style={[styles.activityImage, { backgroundColor: colors.primaryLight + '30', justifyContent: 'center', alignItems: 'center' }]}>
                        <Feather name="activity" size={48} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.activityOverlay}>
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay} />
                      <View style={styles.activityTextContent}>
                        <Text style={styles.activityTitle}>{latestActivity.title || latestActivity.activityType.toUpperCase()}</Text>
                        <Text style={styles.activityDesc} numberOfLines={2}>
                          {latestActivity.content}
                        </Text>
                        <View style={styles.teacherRow}>
                          <Feather name="user" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.teacherText}>{latestActivity.teacherName || 'Class Teacher'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.activityCard, { padding: 40, alignItems: 'center' }]}>
                    <Feather name="calendar" size={40} color={colors.textLight} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No activity updates for today yet.</Text>
                  </View>
                )}
              </View>

              {/* Bus Tracking */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Bus Tracking</Text>
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <View style={styles.busCard}>
                  <View style={styles.mapPlaceholder}>
                    <Feather name="map" size={40} color={colors.primaryLight} />
                    <Text style={styles.mapText}>Map Preview</Text>
                  </View>
                  <View style={styles.busFooter}>
                    <View>
                      <Text style={styles.busLabel}>Location</Text>
                      <Text style={styles.busValue}>{mockData.parent.busStatus.location}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.busLabel}>ETA</Text>
                      <Text style={[styles.busValue, { color: colors.primary }]}>{mockData.parent.busStatus.eta}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {[
                    { name: 'Pay Fees', icon: 'credit-card', color: colors.primary },
                    { name: 'Timetable', icon: 'calendar', color: '#8B5CF6' },
                    { name: 'Gallery', icon: 'image', color: '#EC4899' },
                    { name: 'Report', icon: 'file-text', color: '#F59E0B' },
                  ].map((action, i) => (
                    <TouchableOpacity key={i} style={styles.actionPill}>
                      <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                        <Feather name={action.icon as any} size={20} color={action.color} />
                      </View>
                      <Text style={styles.actionText}>{action.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          )}

          {activeTab === 'bus' && <BusScreen currentChild={displayedChild} />}
          {activeTab === 'activities' && <ActivitiesScreen currentUser={user} currentChild={displayedChild} />}
          {activeTab === 'messages' && <MessagesScreen />}
        </View>

        {/* Floating Emergency Button */}
        <TouchableOpacity
          style={styles.emergencyFloat}
          onPress={() => setShowEmergency(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.danger, '#991B1B']}
            style={styles.emergencyGradient}
          >
            <Feather name="alert-triangle" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            {[
              { id: 'home', label: 'Home', icon: 'home' },
              { id: 'bus', label: 'Bus', icon: 'map-pin' },
              { id: 'activities', label: 'Activities', icon: 'grid' },
              { id: 'messages', label: 'Chat', icon: 'message-square' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={styles.navItem}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Feather
                  name={tab.icon as any}
                  size={24}
                  color={activeTab === tab.id ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.navLabel,
                  activeTab === tab.id && { color: colors.primary, fontWeight: '600' }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flex: 1 },

  rootContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#F3F4F6' : colors.background, // Mobile-like background on web
    alignItems: 'center', // Center on large screens
    justifyContent: 'center',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%', // Max width for mobile look
    height: Platform.OS === 'web' ? '95%' : '100%', // Slight margin on desktop
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 24 : 0, // Rounded corners on web
    shadowColor: Platform.OS === 'web' ? '#000' : 'transparent',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: Platform.OS === 'web' ? 10 : 0,
  },

  // Header & Toolbar
  topToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'web' ? 70 : (Platform.OS === 'ios' ? 100 : 80),
    paddingTop: Platform.OS === 'web' ? 10 : (Platform.OS === 'ios' ? 50 : 30),
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 1000,
  },
  toolbarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  toolbarOrgName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolbarIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toolbarBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: 'white',
  },

  // Greeting Header
  greetingHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeSub: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    zIndex: 100,
    position: 'relative',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Deeper shadow
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  studentDetails: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  statusPill: { position: 'absolute', right: 0, top: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 6 },
  statusText: { fontSize: 11, color: colors.success, fontWeight: '600', textTransform: 'uppercase' },

  // Sections
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  // Activity
  announcementCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  announcementGradient: {
    padding: 16,
    height: 120,
    justifyContent: 'center',
  },
  announcementTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  announcementDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  activityCard: { borderRadius: 20, overflow: 'hidden', height: 200, backgroundColor: 'black' },
  activityImage: { width: '100%', height: '100%', opacity: 0.9 },
  activityOverlay: { ...StyleSheet.absoluteFillObject },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' },
  activityTextContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  activityTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  activityDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teacherText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },

  // Bus Card
  busCard: { backgroundColor: '#EFF6FF', borderRadius: 20, overflow: 'hidden' }, // Light blue bg
  mapPlaceholder: { height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DBEAFE' },
  mapText: { marginTop: 8, color: '#3B82F6', fontWeight: '500' },
  busFooter: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white' },
  busLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  busValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  liveTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  liveText: { color: 'white', fontSize: 10, fontWeight: '700' },

  // Quick Actions
  actionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  actionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  // FAB
  emergencyFloat: { position: 'absolute', bottom: 90, right: 20, zIndex: 50 },
  emergencyGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },

  // Bottom Nav
  bottomNavContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 4, paddingBottom: Platform.OS === 'ios' ? 24 : 0, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 70 },
  navItem: { alignItems: 'center', justifyContent: 'center', width: 60, gap: 4 },
  navLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500' },

  // Emergency Header
  header: { height: 100, paddingTop: 40, paddingHorizontal: 20, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  backButton: { padding: 4 },
  emergencyStatusCard: { backgroundColor: '#FEF2F2', padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#FEE2E2' },
  emergencyIconLarge: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FECACA', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pulseDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'white' },
  emergencyStatusContent: { flex: 1 },
  cardLabel: { fontSize: 12, color: '#7F1D1D' },
  cardTitle: { fontWeight: '700', color: colors.textPrimary },
  cardTime: { fontSize: 12, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: (width - 52) / 2, padding: 16, borderRadius: 16, gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gridTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  gridSub: { fontSize: 12, color: colors.textSecondary },
  alertCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: colors.danger },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertTitle: { fontWeight: '700', color: colors.textPrimary },
  alertTime: { fontSize: 12, color: colors.textSecondary },
  cardDesc: { color: colors.textSecondary, marginTop: 8 },
});

export default App;
