import { Button } from '@/components/Button';
import { DeltaRenderer } from '@/components/DeltaRenderer';
import { Vacancy, vacancyApi } from '@/services/vacancyApi';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

export default function VacancyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadVacancy();
    }
  }, [id]);

  const loadVacancy = async (isRefresh: boolean = false) => {
    if (!id) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const data = await vacancyApi.getVacancyById(id);
      setVacancy(data);
      
      // Automatically track view when vacancy is loaded
      trackView(data);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Vakansiyani yuklashda xatolik');
      if (!isRefresh) {
        router.back();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadVacancy(true);
  };

  const trackView = async (vacancyData?: Vacancy) => {
    if (!id) return;
    
    try {
      const viewCount = await vacancyApi.trackVacancyView(id);
      // Update view count in the vacancy state
      const dataToUpdate = vacancyData || vacancy;
      if (dataToUpdate) {
        setVacancy({ ...dataToUpdate, viewCount });
      }
    } catch (error) {
      // Silently fail - view tracking is not critical
      console.log('Failed to track view:', error);
    }
  };

  const handleBookmark = async () => {
    if (!id || !vacancy) return;
    
    setBookmarkLoading(true);
    try {
      const isBookmarked = await vacancyApi.toggleBookmark(id);
      setVacancy({ ...vacancy, isBookmarked });
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Saqlashda xatolik');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleApply = () => {
    if (!id) return;
    router.push(`/(tabs)/vacancies/${id}/apply` as any);
  };

  if (loading || !vacancy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vakansiya</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{vacancy.name}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={styles.badgeText}>
                  {vacancy.target === 'agent' ? 'Agent' : 'Punkt'}
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>
                  {vacancy.type === 'fulltime' ? 'To\'liq' : 'Yarim'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleBookmark}
            disabled={bookmarkLoading}
          >
            <Ionicons
              name={vacancy.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={28}
              color={vacancy.isBookmarked ? '#2563EB' : '#6B7280'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoGrid}>
          {vacancy.experience && (
            <View style={styles.infoItem}>
              <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{vacancy.experience}</Text>
            </View>
          )}
          {vacancy.salary && (
            <View style={styles.infoItem}>
              <Ionicons name="cash-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{vacancy.salary}</Text>
            </View>
          )}
          {(vacancy.minAge || vacancy.maxAge) && (
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                {vacancy.minAge && vacancy.maxAge
                  ? `${vacancy.minAge}-${vacancy.maxAge} yosh`
                  : vacancy.minAge
                  ? `${vacancy.minAge}+ yosh`
                  : `${vacancy.maxAge}- yosh`}
              </Text>
            </View>
          )}
        </View>

        {vacancy.skills && vacancy.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ko'nikmalar</Text>
            <View style={styles.skillsContainer}>
              {vacancy.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {vacancy.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tavsif</Text>
            <DeltaRenderer delta={vacancy.description} />
          </View>
        )}

        {vacancy.responsibilities && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vazifalar</Text>
            <DeltaRenderer delta={vacancy.responsibilities} />
          </View>
        )}

        {vacancy.preferences && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Talablar</Text>
            <DeltaRenderer delta={vacancy.preferences} />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {vacancy.applicationCount || 0} kishi topshirgan
          </Text>
          <Text style={styles.footerText}>
            {vacancy.viewCount || 0} kishi ko'rgan
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {vacancy.applicationStatus ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Holat:</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    vacancy.applicationStatus === 'accepted'
                      ? '#10B981'
                      : vacancy.applicationStatus === 'rejected'
                      ? '#EF4444'
                      : vacancy.applicationStatus === 'reviewed'
                      ? '#3B82F6'
                      : '#F59E0B',
                },
              ]}
            >
              <Text style={styles.statusText}>
                {vacancy.applicationStatus === 'accepted'
                  ? 'Qabul qilindi'
                  : vacancy.applicationStatus === 'rejected'
                  ? 'Rad etildi'
                  : vacancy.applicationStatus === 'reviewed'
                  ? 'Ko\'rib chiqilmoqda'
                  : 'Kutilmoqda'}
              </Text>
            </View>
          </View>
        ) : (
          <Button
            title="Vakansiyaga topshirish"
            onPress={handleApply}
            style={styles.applyButton}
          />
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePrimary: {
    backgroundColor: '#DBEAFE',
  },
  badgeSecondary: {
    backgroundColor: '#F3E8FF',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  bookmarkButton: {
    padding: 4,
  },
  infoGrid: {
    gap: 12,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 14,
    color: '#4B5563',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    paddingBottom: 20,
  },
  applyButton: {
    marginTop: 0,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

