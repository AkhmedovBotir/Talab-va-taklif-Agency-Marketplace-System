import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';
import apiService, { Contragent } from '../../services/api';

export default function ShopsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { unreadCount } = useNotification();
    const [allContragents, setAllContragents] = useState<Contragent[]>([]); // Barcha yuklangan do'konlar
    const [contragents, setContragents] = useState<Contragent[]>([]); // Ko'rsatiladigan do'konlar (filter qilingan)
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [imgBase, setImgBase] = useState<string | null>(null);

    const loadContragents = useCallback(async (pageNum: number = 1, append: boolean = false, search?: string) => {
        try {
            if (!append) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const response = await apiService.getContragents({
                page: pageNum,
                limit: 20,
                status: 'active',
                search: search || undefined,
            });

            // imgBase ni saqlash (birinchi marta yoki yangilanganda)
            if (response.imgBase) {
                setImgBase(response.imgBase);
            }

            if (append) {
                setAllContragents((prev) => [...prev, ...response.data]);
            } else {
                setAllContragents(response.data);
            }

            setPage(response.page);
            
            // next node dan hasMore ni aniqlash
            if (response.next) {
                setHasMore(true);
            } else {
                setHasMore(response.page < response.totalPages);
            }
        } catch (error: any) {
            console.error('Error loading contragents:', error);
            Alert.alert('Xatolik', error.message || 'Do\'konlarni yuklashda xatolik yuz berdi');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        loadContragents(1, false);
    }, []);

    // Local filter - search query ga qarab do'konlarni filter qilish
    useEffect(() => {
        if (!searchQuery.trim()) {
            // Search bo'sh bo'lsa, barcha do'konlarni ko'rsatish
            setContragents(allContragents);
        } else {
            // Search query ga qarab filter qilish (do'kon nomiga qarab)
            const query = searchQuery.toLowerCase().trim();
            const filtered = allContragents.filter((contragent) =>
                contragent.name.toLowerCase().includes(query)
            );
            setContragents(filtered);
        }
    }, [searchQuery, allContragents]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        setSearchQuery(''); // Search ni tozalash
        loadContragents(1, false);
    }, [loadContragents]);

    const handleLoadMore = useCallback(() => {
        // Search bo'lganda loadMore ishlamasligi kerak
        if (!loadingMore && hasMore && !searchQuery.trim()) {
            loadContragents(page + 1, true);
        }
    }, [loadingMore, hasMore, page, loadContragents, searchQuery]);

    const handleShopPress = (contragent: Contragent) => {
        // Navigate to search with contragent filter
        router.push({
            pathname: '/(tabs)/search',
            params: { contragentId: contragent._id, contragentName: contragent.name },
        });
    };

    const handleNotificationPress = () => {
        router.push('/notifications' as any);
    };

    const renderItem = ({ item }: { item: Contragent }) => {
        // imgBase dan foydalanib logo URL ni to'g'ri qilish
        const logoUrl = item.logo 
            ? (imgBase && !item.logo.startsWith('http') 
                ? `${imgBase}${item.logo}` 
                : item.logo)
            : null;

        return (
            <TouchableOpacity
                style={styles.shopCard}
                onPress={() => handleShopPress(item)}
                activeOpacity={0.8}
            >
                <View style={styles.shopIconContainer}>
                    {logoUrl ? (
                        <Image 
                            source={{ uri: logoUrl }} 
                            style={styles.shopLogo}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="storefront" size={24} color="#007AFF" />
                    )}
                </View>
                <View style={styles.shopInfo}>
                    <Text style={styles.shopName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.shopLocation}>
                        <Text style={styles.locationText} >
                            {item.viloyat?.name || ''}
                            {item.tuman?.name ? `, ${item.tuman.name}` : ''}
                            {item.mfy?.name ? `, ${item.mfy.name}` : ''}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="storefront-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Do'konlar topilmadi</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Header title="Do'konlar" onNotificationPress={handleNotificationPress} unreadCount={unreadCount} />

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Do'kon qidirish..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && contragents.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={contragents}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 100 },
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={!searchQuery.trim() ? handleLoadMore : undefined}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    listContent: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    shopCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shopIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    shopLogo: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    shopInfo: {
        flex: 1,
        marginRight: 12,
    },
    shopName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    shopLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    shopPhone: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    phoneText: {
        fontSize: 14,
        color: '#666',
    },
});
