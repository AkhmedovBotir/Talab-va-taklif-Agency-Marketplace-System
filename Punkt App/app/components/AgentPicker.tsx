import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, AgentSelection } from '../services/api';

interface AgentPickerProps {
  selectedAgent: AgentSelection | null;
  onSelect: (agent: AgentSelection) => void;
  viloyatId?: string;
  tumanId?: string;
  mfyId?: string;
}

export function AgentPicker({
  selectedAgent,
  onSelect,
  viloyatId,
  tumanId,
  mfyId,
}: AgentPickerProps) {
  const [agents, setAgents] = useState<AgentSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (showList) {
      loadAgents();
    }
  }, [showList, searchQuery, viloyatId, tumanId, mfyId]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const params: any = {
        status: 'active',
        page: 1,
        limit: 100,
      };

      if (viloyatId) {
        params.viloyat = viloyatId;
      }

      if (tumanId) {
        params.tuman = tumanId;
      }

      if (mfyId) {
        params.mfy = mfyId;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiService.getAgentsForSelection(params);
      setAgents(response.data);
    } catch (error: any) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (agent: AgentSelection) => {
    onSelect(agent);
    setShowList(false);
    setSearchQuery('');
  };

  const getAgentTypeLabel = (type: string) => {
    switch (type) {
      case 'viloyat':
        return 'Viloyat';
      case 'tuman':
        return 'Tuman';
      case 'mfy':
        return 'MFY';
      default:
        return type;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowList(!showList)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, !selectedAgent && styles.placeholder]} numberOfLines={1}>
          {selectedAgent
            ? `${selectedAgent.name} (${getAgentTypeLabel(selectedAgent.agentType)})`
            : 'Agentni tanlang'}
        </Text>
        <Ionicons
          name={showList ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#666"
        />
      </TouchableOpacity>

      {showList && (
        <View style={styles.dropdown}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Qidirish (nomi yoki telefon)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={agents}
              keyExtractor={(item) => item._id}
              style={styles.list}
              nestedScrollEnabled
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedAgent?._id === item._id && styles.itemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={[
                        styles.typeBadge,
                        item.agentType === 'viloyat' && styles.typeviloyat,
                        item.agentType === 'tuman' && styles.typetuman,
                        item.agentType === 'mfy' && styles.typemfy,
                      ]}>
                        <Text style={styles.typeText}>{getAgentTypeLabel(item.agentType)}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemPhone}>{item.phone}</Text>
                    <Text style={styles.itemLocation}>
                      {item.viloyat.name}
                      {item.tuman && `, ${item.tuman.name}`}
                      {item.mfy && `, ${item.mfy.name}`}
                    </Text>
                  </View>
                  {selectedAgent?._id === item._id && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Agentlar topilmadi</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    minHeight: 48,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  placeholder: {
    color: '#999',
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 4,
  },
  list: {
    maxHeight: 250,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemSelected: {
    backgroundColor: '#007AFF10',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  typeviloyat: {
    backgroundColor: '#FF9500',
  },
  typetuman: {
    backgroundColor: '#007AFF',
  },
  typemfy: {
    backgroundColor: '#34C759',
  },
  itemPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

