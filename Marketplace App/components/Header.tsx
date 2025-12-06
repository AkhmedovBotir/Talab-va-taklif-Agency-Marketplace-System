import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  onNotificationPress?: () => void;
  rightButton?: ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  unreadCount?: number;
}

export default function Header({ 
  title = 'Marketplace', 
  onNotificationPress, 
  rightButton,
  showBackButton = false,
  onBackPress,
  unreadCount = 0,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
        },
      ]}
    >
      <View style={styles.content}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {title}
          </Text>
        </View>
        {rightButton ? (
          rightButton
        ) : (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    pointerEvents: 'none',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    zIndex: 10,
  },
  backButtonPlaceholder: {
    width: 40,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});



