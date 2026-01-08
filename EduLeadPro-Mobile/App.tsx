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
  StatusBar as RNStatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Services & Screens
import { api, type Child, type DailyUpdate, type Attendance, type Announcement } from './services/api';
import { offlineCache } from './src/services/offline-cache';
import { useOffline } from './src/hooks/useOffline';
import OfflineBanner from './src/components/OfflineBanner';

import LoginScreen from './LoginScreen';
import BusScreen from './BusScreen';
import ActivitiesScreen from './ActivitiesScreen';
import MessagesScreen from './MessagesScreen';
import TeacherHomeScreen from './TeacherHomeScreen';
import DriverHomeScreen from './DriverHomeScreen';
import ParentFeesScreen from './ParentFeesScreen';

// Premium Design System
import { colors, spacing, typography, shadows, layout } from './src/theme';
import PremiumCard from './src/components/ui/PremiumCard';
import PremiumDrawer from './src/components/ui/PremiumDrawer';

const { width } = layout;

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
    busStatus: {
      isLive: true,
      busNumber: 'MH 12 AB 1234',
      location: 'Near City Mall',
      eta: '15 mins',
    },
  },
};


function App() {
  const [fontsLoaded] = useFonts({
    ...Feather.font,
  });

  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  type TabType = 'home' | 'bus' | 'activities' | 'notifications' | 'fees';
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [drawerVisible, setDrawerVisible] = useState(false); // Drawer State
  const [showEmergency, setShowEmergency] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Data State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [latestActivity, setLatestActivity] = useState<DailyUpdate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /* State */
  const [feeBalance, setFeeBalance] = useState<number | null>(null);
  const [nextPayment, setNextPayment] = useState<{ amount: number; label: string; date?: string; status: 'paid' | 'due' | 'outstanding' } | null>(null);


  const { isOnline, lastSyncTime, syncNow, isSyncing } = useOffline();

  // Initialization
  useEffect(() => {
    const init = async () => {
      // TEMPORARILY DISABLED: try { await offlineCache.init(); } catch (e) { console.error(e); }
      try {
        const sessionData = await AsyncStorage.getItem('user_session');
        if (sessionData) {
          const { user: savedUser, students } = JSON.parse(sessionData);
          setUser(savedUser);
          setChildren(students);
          if (savedUser.role === 'parent' && students.length > 0) {
            fetchLiveData(students[0].id, savedUser.organization_id);
          }
        }
      } catch (e) { console.error(e); } finally { setIsLoadingSession(false); }
    };
    init();
  }, []);

  const fetchLiveData = async (childId: number, organizationId: number) => {
    if (!childId || !organizationId) {
      console.warn('fetchLiveData called with invalid IDs:', { childId, organizationId });
      return;
    }
    try {
      if (!isOnline) {
        // TEMPORARILY DISABLED: Offline mode with cache
        console.log('[App] Offline mode - cache disabled');
        return;
      }

      const [annRes, attRes, updRes, feeRes] = await Promise.all([
        api.getAnnouncements(organizationId),
        api.getTodayAttendance(childId),
        api.getDailyUpdates(childId),
        api.getStudentFees(childId)
      ]);
      setAnnouncements(annRes);
      setTodayAttendance(attRes);
      if (updRes.length > 0) setLatestActivity(updRes[0]);

      if (feeRes) {
        setFeeBalance(feeRes.balance);

        // Smart Payment Logic
        if (feeRes.balance <= 0) {
          setNextPayment({ amount: 0, label: 'All Paid', status: 'paid' });
        } else if (feeRes.emiDetails?.installments) {
          const upcoming = feeRes.emiDetails.installments.find((i: any) => i.status === 'pending');
          if (upcoming) {
            const d = new Date(upcoming.dueDate);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            setNextPayment({ amount: upcoming.amount, label: `Due ${dateStr}`, date: upcoming.dueDate, status: 'due' });
          } else {
            setNextPayment({ amount: feeRes.balance, label: 'Outstanding', status: 'outstanding' });
          }
        } else {
          setNextPayment({ amount: feeRes.balance, label: 'Outstanding', status: 'outstanding' });
        }
      }

      // TEMPORARILY DISABLED: Cache saving
      // await offlineCache.cacheAnnouncements(annRes);
      // await offlineCache.cacheAttendance(childId, attRes ? [attRes] : []);
      // await offlineCache.cacheActivities(childId, updRes);
    } catch (e) { console.error('Error fetching live data:', e); }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (user && children.length > 0 && children[0].id) {
      await fetchLiveData(children[0].id, user.organization_id);
    } else {
      console.warn('Cannot refresh: Missing user or student data');
    }
    setIsRefreshing(false);
  };

  const handleLoginSuccess = async (loggedInUser: any, students: any[]) => {
    setUser(loggedInUser);
    setChildren(students);
    if (loggedInUser.role === 'parent' && students.length > 0) {
      fetchLiveData(students[0].id, loggedInUser.organization_id);
    }
    await AsyncStorage.setItem('user_session', JSON.stringify({ user: loggedInUser, students }));
  };

  const handleLogout = async () => {
    setUser(null);
    setChildren([]);
    setActiveTab('home');
    setDrawerVisible(false);
    await api.clearTokens();
    await AsyncStorage.removeItem('user_session');
    // TEMPORARILY DISABLED: await offlineCache.clearAllCache();
  };

  // Rendering Helpers
  const displayedChild = children.length > 0 ? {
    id: children[0].id,
    name: children[0].name,
    class: children[0].class || 'N/A',
    batch: 'Standard',
    status: children[0].status || 'Active',
    checkInTime: todayAttendance?.checkInTime || 'Not checked in'
  } : mockData.parent.child;

  if (!fontsLoaded || isLoadingSession) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  if (user.role === 'teacher') return <TeacherHomeScreen user={user} onLogout={handleLogout} />;
  if (user.role === 'driver') return <DriverHomeScreen user={user} onLogout={handleLogout} />;

  // -------------------------------- PARENT UI --------------------------------

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
          <Feather name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerOrg}>{user.organizationName || 'EduLead Pro'}</Text>
          <Text style={styles.headerTitle}>
            {activeTab === 'home' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Text>
        </View>

        <TouchableOpacity style={styles.profileBtn} onPress={() => setActiveTab('notifications')}>
          <Feather name="bell" size={20} color={colors.textSecondary} />
          {announcements.length > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <OfflineBanner isOnline={isOnline} lastSyncTime={lastSyncTime} isSyncing={isSyncing} onSyncPress={syncNow} />

        {activeTab === 'home' && (
          <>
            {/* --- Child Hero Card --- */}
            <View style={styles.heroSection}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroRow}>
                  <View style={styles.heroAvatar}>
                    <Feather name="user" size={32} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroName}>{displayedChild.name}</Text>
                    <Text style={styles.heroDetail}>{displayedChild.class}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{displayedChild.status}</Text>
                  </View>
                </View>

                {/* Live Stats inside Card */}
                <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Feather name="user-check" size={16} color={colors.accent} />
                    <Text style={styles.heroStatValue}>{todayAttendance ? (todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)) : 'Pending'}</Text>
                    <Text style={styles.heroStatLabel}>Attendance</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  {children.length > 0 && (children[0].pickup_location || children[0].drop_location) ? (
                    <View style={styles.heroStatItem}>
                      <Feather name="navigation" size={16} color={colors.accent} />
                      <Text style={styles.heroStatValue}>Assigned</Text>
                      <Text style={styles.heroStatLabel}>Transport</Text>
                    </View>
                  ) : (
                    <View style={styles.heroStatItem}>
                      {nextPayment?.status === 'paid' ? (
                        <>
                          <Feather name="check-circle" size={16} color={colors.success} />
                          <Text style={[styles.heroStatValue, { color: colors.success }]}>Paid</Text>
                          <Text style={styles.heroStatLabel}>Fees Cleared</Text>
                        </>
                      ) : nextPayment?.status === 'due' ? (
                        <>
                          <Feather name="calendar" size={16} color={colors.accent} />
                          <Text style={styles.heroStatValue}>₹{nextPayment.amount.toLocaleString('en-IN')}</Text>
                          <Text style={styles.heroStatLabel}>{nextPayment.label}</Text>
                        </>
                      ) : (
                        <>
                          <Feather name="credit-card" size={16} color={colors.accent} />
                          <Text style={styles.heroStatValue}>{feeBalance !== null ? `₹${feeBalance.toLocaleString('en-IN')}` : '--'}</Text>
                          <Text style={styles.heroStatLabel}>Fees Due</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* --- Quick Actions (Pills) --- */}
            <View style={{ paddingVertical: spacing.md }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.quickActionsContainer, { paddingHorizontal: 0 }]}
              >
                {[
                  { label: 'Bus', icon: 'map', tab: 'bus', color: colors.info },
                  { label: 'Fees', icon: 'credit-card', tab: 'fees', color: colors.danger },
                  { label: 'Alerts', icon: 'bell', tab: 'notifications', color: colors.warning },
                ].map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickActionPill}
                    onPress={() => setActiveTab(action.tab as TabType)}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                      <Feather name={action.icon as any} size={20} color={action.color} />
                    </View>
                    <Text style={styles.quickActionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* --- Latest Announcement --- */}
            {announcements.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Notice Board</Text>
                </View>
                <PremiumCard style={{ backgroundColor: colors.infoBg }}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Feather name="bell" size={24} color={colors.info} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.info }]}>{announcements[0].title}</Text>
                      <Text style={styles.cardDesc} numberOfLines={2}>{announcements[0].content}</Text>
                    </View>
                  </View>
                </PremiumCard>
              </View>
            )}

            {/* --- Activity Feed Preview --- */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Highlights</Text>
                <TouchableOpacity onPress={() => setActiveTab('activities')}>
                  <Text style={styles.seeAll}>View All</Text>
                </TouchableOpacity>
              </View>

              {latestActivity ? (
                <PremiumCard style={{ padding: 0 }}>
                  {latestActivity.mediaUrls && latestActivity.mediaUrls.length > 0 ? (
                    <Image source={{ uri: latestActivity.mediaUrls[0] }} style={{ width: '100%', height: 180 }} />
                  ) : (
                    <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHighlight }}>
                      <Feather name="image" size={40} color={colors.textTertiary} />
                    </View>
                  )}
                  <View style={{ padding: spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.activityTitle}>{latestActivity.title || 'Class Activity'}</Text>
                      <Text style={styles.activityDate}>{new Date(latestActivity.postedAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={3}>{latestActivity.content}</Text>
                  </View>
                </PremiumCard>
              ) : (
                <PremiumCard variant="flat" style={{ alignItems: 'center', padding: spacing.xl }}>
                  <Feather name="sun" size={40} color={colors.textTertiary} />
                  <Text style={{ marginTop: 12, color: colors.textSecondary }}>No updates yet today.</Text>
                </PremiumCard>
              )}
            </View>
          </>
        )}

        {/* --- Dynamic Screen Content --- */}
        {activeTab === 'bus' && <View style={styles.modalContainer}><BusScreen currentChild={displayedChild} /></View>}
        {activeTab === 'activities' && <View style={styles.modalContainer}><ActivitiesScreen currentUser={user} currentChild={displayedChild} /></View>}
        {activeTab === 'notifications' && <View style={styles.modalContainer}><MessagesScreen announcements={announcements} /></View>}
        {activeTab === 'fees' && <View style={styles.modalContainer}><ParentFeesScreen currentChild={displayedChild} /></View>}


        {/* Spacer for scroll */}
        <View style={{ height: 50 }} />

      </ScrollView>

      {/* --- Sidebar Drawer --- */}
      <PremiumDrawer
        isVisible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as TabType)}
        user={{ name: user.name, role: user.role }}
        onLogout={handleLogout}
        menuItems={[
          { id: 'home', label: 'Home Overview', icon: 'home' },
          { id: 'activities', label: 'Daily Updates', icon: 'grid' },
          { id: 'bus', label: 'Bus Tracking', icon: 'map-pin' },
          { id: 'fees', label: 'Fee Payments', icon: 'credit-card' },
          { id: 'notifications', label: 'Notifications', icon: 'bell' },
        ]}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Added border for sidebar mode
  },
  menuBtn: { padding: 8, marginLeft: -8 }, // Align visual left
  headerOrg: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: '700' },
  headerTitle: { ...typography.h3, fontSize: 16, marginTop: -2 },
  profileBtn: { padding: 8, backgroundColor: colors.surfaceHighlight, borderRadius: 20 },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1, borderColor: colors.surfaceHighlight },

  heroSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg, marginTop: spacing.md },
  heroCard: { borderRadius: spacing.borderRadius.lg, padding: spacing.lg, ...shadows.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  heroAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  heroName: { ...typography.h3, color: colors.textInverted },
  heroDetail: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: colors.success, textTransform: 'uppercase' },

  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { ...typography.h3, color: colors.textInverted, fontSize: 16, marginTop: 4 },
  heroStatLabel: { ...typography.caption, color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  quickActionsContainer: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg, justifyContent: 'center', flexGrow: 1 },
  quickActionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30, ...shadows.sm },
  quickActionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  quickActionText: { ...typography.caption, fontWeight: '600', color: colors.textPrimary, fontSize: 13 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, fontSize: 18 },
  seeAll: { ...typography.button, color: colors.accent, fontSize: 14 },

  cardTitle: { ...typography.h3, fontSize: 16, marginBottom: 4 },
  cardDesc: { ...typography.body, color: colors.textSecondary, fontSize: 13 },
  activityTitle: { ...typography.h3, fontSize: 16 },
  activityDate: { ...typography.caption },

  modalContainer: { marginTop: 10, minHeight: 400 },

});


export default App;
