import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vacancy } from '@/services/vacancyApi';

interface VacancyCardProps {
  vacancy: Vacancy;
  onPress: () => void;
  onBookmark?: () => void;
}

export function VacancyCard({ vacancy, onPress, onBookmark }: VacancyCardProps) {
  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'accepted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'reviewed':
        return '#3B82F6';
      case 'pending':
        return '#F59E0B';
      default:
        return 'transparent';
    }
  };

  const getStatusText = (status?: string | null) => {
    switch (status) {
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      case 'reviewed':
        return 'Ko\'rib chiqilmoqda';
      case 'pending':
        return 'Kutilmoqda';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>
            {vacancy.name}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeAgent]}>
              <Ionicons 
                name={vacancy.target === 'agent' ? 'person-outline' : 'location-outline'} 
                size={12} 
                color="#2563EB" 
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>
                {vacancy.target === 'agent' ? 'Agent' : 'Punkt'}
              </Text>
            </View>
            <View style={[styles.badge, styles.badgeType]}>
              <Ionicons 
                name={vacancy.type === 'fulltime' ? 'time-outline' : 'time-outline'} 
                size={12} 
                color="#7C3AED" 
                style={styles.badgeIcon}
              />
              <Text style={styles.badgeText}>
                {vacancy.type === 'fulltime' ? 'To\'liq' : 'Yarim'}
              </Text>
            </View>
          </View>
        </View>
        {onBookmark && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
            style={styles.bookmarkButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={vacancy.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={vacancy.isBookmarked ? '#2563EB' : '#9CA3AF'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {vacancy.experience && (
          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={18} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>{vacancy.experience}</Text>
          </View>
        )}
        {vacancy.salary && (
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={18} color="#6B7280" />
            <Text style={styles.infoText} numberOfLines={1}>{vacancy.salary}</Text>
          </View>
        )}
        {(vacancy.minAge || vacancy.maxAge) && (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
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

      {/* Skills Section */}
      {vacancy.skills && vacancy.skills.length > 0 && (
        <View style={styles.skillsSection}>
          <View style={styles.skillsContainer}>
            {vacancy.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {vacancy.skills.length > 3 && (
              <View style={styles.moreSkillsTag}>
                <Text style={styles.moreSkillsText}>+{vacancy.skills.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Status Badge */}
      {vacancy.applicationStatus && (
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(vacancy.applicationStatus) }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{getStatusText(vacancy.applicationStatus)}</Text>
          </View>
        </View>
      )}

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="people-outline" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            {vacancy.applicationCount || 0} ariza
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="eye-outline" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            {vacancy.viewCount || 0} ko'rish
          </Text>
        </View>
        {vacancy.createdAt && (
          <Text style={styles.footerDate}>
            {new Date(vacancy.createdAt).toLocaleDateString('uz-UZ', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  badgeAgent: {
    backgroundColor: '#EFF6FF',
  },
  badgeType: {
    backgroundColor: '#F5F3FF',
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  bookmarkButton: {
    padding: 4,
    borderRadius: 8,
  },
  infoSection: {
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  moreSkillsTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  moreSkillsText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
