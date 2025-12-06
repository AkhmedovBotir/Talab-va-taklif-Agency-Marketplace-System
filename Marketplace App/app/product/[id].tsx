import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import ImageCarousel from '../../components/ui/ImageCarousel';
import ImageViewer from '../../components/ui/ImageViewer';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import apiService, { Product } from '../../services/api';

export default function ProductDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [webViewHeight, setWebViewHeight] = useState(200);

    useEffect(() => {
        if (id) {
            loadProduct();
        }
    }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const response = await apiService.getProductById(id!);
            setProduct(response.data);
        } catch (error: any) {
            console.error('Error loading product:', error);
            Alert.alert('Xatolik', error.message || 'Mahsulotni yuklashda xatolik yuz berdi');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
    };


    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();

    const handleAddToCart = async () => {
        if (!product) return;

        if (!isAuthenticated) {
            Alert.alert(
                'Kirish kerak',
                'Korzinkaga qo\'shish uchun tizimga kiring',
                [
                    { text: 'Bekor qilish', style: 'cancel' },
                    {
                        text: 'Kirish',
                        onPress: () => router.push('/(auth)/login'),
                    },
                ]
            );
            return;
        }

        try {
            await addToCart(product._id, 1);
            Alert.alert('Muvaffaqiyatli', `${product.name} korzinkaga qo'shildi`);
        } catch (error) {
            // Error is already shown in context
        }
    };

    const handleImagePress = (index: number) => {
        setSelectedImageIndex(index);
        setImageViewerVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Mahsulot topilmadi</Text>
                </View>
            </View>
        );
    }

    const images = product.images && product.images.length > 0 ? product.images : [];

    // Table data rows
    const tableRows = [
        { label: 'Narxi', value: formatPrice(product.price) },
        { label: 'Mahsulot kodi', value: product.productCode },
        { label: 'Miqdori', value: `${product.quantity} ${product.unit}` },
        { label: 'O\'lchami', value: product.unitSize ? `${product.unitSize} ${product.unit}` : 'N/A' },
        { label: 'Sotuvchi', value: product.contragent.name },
        { label: 'Kategoriya', value: product.category.name + (product.subcategory ? ` → ${product.subcategory.name}` : '') },
    ];

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.header,
                    { paddingTop: insets.top },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mahsulot</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Carousel */}
                {images.length > 0 ? (
                    <ImageCarousel
                        images={images}
                        autoPlay={images.length > 1}
                        autoPlayInterval={3000}
                        onImagePress={handleImagePress}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={64} color="#ccc" />
                    </View>
                )}

                {/* Product Info */}
                <View style={styles.content}>
                    <Text style={styles.name}>{product.name}</Text>

                    {/* Table-like Information */}
                    <View style={styles.tableContainer}>

                        {tableRows.map((row, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.tableRow,
                                    index === tableRows.length - 1 && styles.tableRowLast,
                                ]}
                            >
                                <Text style={styles.tableLabel}>{row.label}</Text>
                                <Text style={styles.tableValue}>{row.value}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    {product.description && (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Tavsif</Text>
                            <View style={styles.descriptionContainer}>
                                <WebView
                                    originWhitelist={['*']}
                                    source={{
                                        html: `
                                            <!DOCTYPE html>
                                            <html>
                                                <head>
                                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                                    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
                                                    <style>
                                                        body {
                                                            margin: 0;
                                                            padding: 16px;
                                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                                        }
                                                        #editor-container {
                                                            border: none;
                                                        }
                                                        .ql-editor {
                                                            padding: 0;
                                                            font-size: 15px;
                                                            line-height: 22px;
                                                            color: #666;
                                                        }
                                                        .ql-editor.ql-blank::before {
                                                            color: #999;
                                                            font-style: normal;
                                                        }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div id="editor-container"></div>
                                                    <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
                                                    <script>
                                                        var quill = new Quill('#editor-container', {
                                                            theme: 'snow',
                                                            readOnly: true,
                                                            modules: {
                                                                toolbar: false
                                                            }
                                                        });
                                                        var delta = ${JSON.stringify(product.description)};
                                                        quill.setContents(delta);
                                                        
                                                        // Send height to React Native
                                                        setTimeout(function() {
                                                            var height = document.body.scrollHeight;
                                                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
                                                        }, 500);
                                                    </script>
                                                </body>
                                            </html>
                                        `,
                                    }}
                                    style={[styles.descriptionWebView, { height: webViewHeight }]}
                                    scrollEnabled={false}
                                    showsVerticalScrollIndicator={false}
                                    onMessage={(event) => {
                                        try {
                                            const data = JSON.parse(event.nativeEvent.data);
                                            if (data.type === 'height' && data.height) {
                                                setWebViewHeight(Math.max(data.height, 200));
                                            }
                                        } catch (error) {
                                            console.error('Error parsing WebView message:', error);
                                        }
                                    }}
                                    injectedJavaScript={`
                                        (function() {
                                            function updateHeight() {
                                                var height = document.body.scrollHeight;
                                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
                                            }
                                            setTimeout(updateHeight, 500);
                                            setTimeout(updateHeight, 1000);
                                        })();
                                    `}
                                />
                            </View>
                        </View>
                    )}

                    {/* Delivery Regions */}
                    {product.deliveryRegions && product.deliveryRegions.length > 0 && (
                        <View style={styles.deliverySection}>
                            <Text style={styles.sectionTitle}>Yetkazib berish hududlari</Text>
                            {product.deliveryRegions.map((region, index) => (
                                <View key={index} style={styles.deliveryRegion}>
                                    <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                                    <Text style={styles.deliveryText}>
                                        {region.viloyat.name}
                                        {region.tuman && `, ${region.tuman.name}`}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View
                style={[
                    styles.actionBar,
                    { paddingBottom: insets.bottom + 16 },
                ]}
            >
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={handleAddToCart}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cart" size={24} color="#fff" />
                    <Text style={styles.cartButtonText}>Korzinkaga qo'shish</Text>
                </TouchableOpacity>
            </View>

            {/* Image Viewer Modal */}
            {images.length > 0 && (
                <ImageViewer
                    visible={imageViewerVisible}
                    images={images}
                    initialIndex={selectedImageIndex}
                    onClose={() => setImageViewerVisible(false)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    imagePlaceholder: {
        width: '100%',
        height: 300,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
    },
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e5e7',
        marginBottom: 24,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e7',
    },
    tableHeaderText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tableRowLast: {
        borderBottomWidth: 0,
    },
    tableLabel: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    tableValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        textAlign: 'right',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e5e7',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    descriptionContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f9f9f9',
    },
    descriptionWebView: {
        backgroundColor: 'transparent',
        minHeight: 200,
    },
    deliverySection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    deliveryRegion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    deliveryText: {
        fontSize: 14,
        color: '#666',
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5e7',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    cartButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cartButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
    },
});
