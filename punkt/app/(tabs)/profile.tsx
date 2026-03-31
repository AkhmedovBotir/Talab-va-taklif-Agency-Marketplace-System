import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { FEATURE_NOTIFICATIONS_ENABLED } from '../config/features';
import { KpiSummarySection } from '../components/KpiSummarySection';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useKpiSummary } from '../hooks/useKpiSummary';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { apiService } from '../services/api';

export default function ProfileScreen() {
  const { punkt, logout } = useAuth();
  const { showConfirm } = useDialog();
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const { refresh: refreshKpiSummary } = useKpiSummary();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const contentMaxWidth = Math.min(560, Math.max(windowWidth - 32, 280));
  const horizontalPad = Math.max(16, Math.min(28, windowWidth * 0.04));
  const headerPadTop = isWeb ? 24 : 50;

  useFocusEffect(
    useCallback(() => {
      refreshKpiSummary();
    }, [refreshKpiSummary])
  );

  const handleLogout = () => {
    void (async () => {
      const ok = await showConfirm({
        title: 'Chiqish',
        message: 'Hisobingizdan chiqmoqchimisiz?',
        cancelText: 'Bekor qilish',
        confirmText: 'Chiqish',
        destructive: true,
      });
      if (!ok) return;
      await logout();
      router.replace('/(auth)/login');
    })();
  };

  useEffect(() => {
    if (!punkt) {
      setRegionName(null);
      setDistrictName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [rName, dName] = await Promise.all([
        apiService.getNoauthRegionNameById(punkt.viloyat_id),
        apiService.getNoauthDistrictNameById(punkt.tuman_id),
      ]);
      if (!cancelled) {
        setRegionName(rName);
        setDistrictName(dName);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [punkt.viloyat_id, punkt.tuman_id]);

  if (!punkt) {
    return null;
  }

  const displayRegion =
    regionName || punkt.viloyat.name || (punkt.viloyat_id ? `Viloyat #${punkt.viloyat_id}` : '—');
  const displayDistrict =
    districtName || punkt.tuman.name || (punkt.tuman_id ? `Tuman #${punkt.tuman_id}` : '—');

  const profileInner = (
    <>
      <View
        style={[
          styles.headerBase,
          isWeb ? styles.headerWeb : styles.headerMobile,
          { paddingTop: headerPadTop },
        ]}
      >
        <View style={styles.avatar}>
          <Ionicons name="business" size={48} color="#007AFF" />
        </View>
        <Text style={styles.name}>{punkt.name}</Text>
        <Text style={styles.phone}>{punkt.phone}</Text>
      </View>

      <KpiSummarySection />

      <View style={isWeb ? styles.sectionWeb : styles.sectionMobile}>
        <View style={styles.menuCard}>
          {FEATURE_NOTIFICATIONS_ENABLED ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/notifications')}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name="notifications-outline" size={22} color="#007AFF" />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Xabarlar</Text>
                  {unreadCount > 0 && (
                    <Text style={styles.menuSubtitle}>{unreadCount} ta yangi xabar</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />
            </>
          ) : null}

          <View style={styles.infoItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="location-outline" size={22} color="#666" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Viloyat</Text>
              <Text style={styles.menuValue}>{displayRegion}</Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.infoItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="map-outline" size={22} color="#666" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Tuman</Text>
              <Text style={styles.menuValue}>{displayDistrict}</Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.infoItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#34C759" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Holat</Text>
              <Text style={[styles.menuValue, punkt.status === 'active' && styles.statusActive]}>
                {punkt.status === 'active' ? 'Faol' : 'Nofaol'}
              </Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setChangePasswordOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="key-outline" size={22} color="#007AFF" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Parolni almashtirish</Text>
              <Text style={styles.menuSubtitleMuted}>Joriy parol va yangi parol</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={isWeb ? styles.sectionWeb : styles.sectionMobile}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={isWeb ? styles.scrollContentWeb : undefined}
    >
      {isWeb ? (
        <View
          style={[
            styles.contentShell,
            {
              maxWidth: contentMaxWidth,
              width: '100%',
              paddingHorizontal: horizontalPad,
            },
          ]}
        >
          {profileInner}
        </View>
      ) : (
        profileInner
      )}
    </ScrollView>
    <ChangePasswordModal
      visible={changePasswordOpen}
      onClose={() => setChangePasswordOpen(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContentWeb: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 32,
  },
  contentShell: {
    alignSelf: 'center',
  },
  headerBase: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerMobile: {
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  headerWeb: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } as object)
      : {}),
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  sectionMobile: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionWeb: {
    paddingVertical: 12,
    width: '100%',
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } as object)
      : {}),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  menuSubtitleMuted: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuLabel: {
    fontSize: 13,
    color: '#666',
  },
  menuValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 64,
  },
  statusActive: {
    color: '#34C759',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } as object)
      : {}),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
