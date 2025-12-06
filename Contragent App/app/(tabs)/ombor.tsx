import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import KategoriyalarScreen from './ombor/kategoriyalar';
import MaxsulotlarScreen from './ombor/maxsulotlar';

export default function OmborScreen() {
  const [activeTab, setActiveTab] = useState<'kategoriyalar' | 'maxsulotlar'>('kategoriyalar');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'kategoriyalar' && styles.activeTab]}
          onPress={() => setActiveTab('kategoriyalar')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'kategoriyalar' && styles.activeTabText,
            ]}
          >
            Kategoriyalar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'maxsulotlar' && styles.activeTab]}
          onPress={() => setActiveTab('maxsulotlar')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'maxsulotlar' && styles.activeTabText,
            ]}
          >
            Maxsulotlar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'kategoriyalar' ? (
          <KategoriyalarScreen />
        ) : (
          <MaxsulotlarScreen />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
