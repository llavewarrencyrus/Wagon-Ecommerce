import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getBuyerOrders, cancelBuyerOrder } from '@/data/data';
import { BuyerOrder, OrderStatus } from '@/types/types';
import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type TabKey = 'all' | OrderStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'To Pay' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'To Receive' },
  { key: 'delivered', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const params = useLocalSearchParams<{ initialStatus?: TabKey }>();
  const [selectedTab, setSelectedTab] = useState<TabKey>(params.initialStatus || 'all');
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!isRefresh) setLoading(true);
    const data = await getBuyerOrders(userId, selectedTab);
    setOrders(data as BuyerOrder[]);
    setLoading(false);
    if (isRefresh) setRefreshing(false);
  }, [userId, selectedTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(orderId);
            try {
              await cancelBuyerOrder(orderId);
              setOrders((prev) =>
                prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'cancelled' as OrderStatus } : ord))
              );
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not cancel order.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', bg: '#fef3c7', text: '#b45309', icon: 'time-outline' as const };
      case 'processing':
        return { label: 'Processing', bg: '#ffedd5', text: '#c2410c', icon: 'cube-outline' as const };
      case 'shipped':
        return { label: 'Shipped', bg: '#dbeafe', text: '#1d4ed8', icon: 'car-outline' as const };
      case 'delivered':
        return { label: 'Delivered', bg: '#dcfce7', text: '#15803d', icon: 'checkmark-circle-outline' as const };
      case 'cancelled':
        return { label: 'Cancelled', bg: '#fee2e2', text: '#b91c1c', icon: 'close-circle-outline' as const };
      default:
        return { label: status, bg: '#f3f4f6', text: '#4b5563', icon: 'help-circle-outline' as const };
    }
  };

  const renderOrderItem = ({ item }: { item: BuyerOrder }) => {
    const variant = item.product_variant;
    const product = variant?.products;
    const badge = getStatusBadge(item.status);

    const price = product?.product_price || 0;
    const discount = product?.product_discount || 0;
    const unitPrice = discount > 0 ? price * (1 - discount / 100) : price;
    const qty = variant?.product_quantity || 1;
    const totalPrice = unitPrice;

    const imageUri =
      variant?.product_color?.image ||
      (product?.product_image && product.product_image[0]) ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

    const orderShortId = item.id.substring(0, 8).toUpperCase();
    const orderDate = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="receipt" size={16} color={Colors.primary} />
            <Text style={styles.orderIdText}>Order #{orderShortId}</Text>
            <Text style={styles.orderDateText}>• {orderDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon} size={13} color={badge.text} style={{ marginRight: 3 }} />
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Product Details Row */}
        <TouchableOpacity
          style={styles.orderBodyRow}
          onPress={() => product?.product_id && router.push(`/ProductScreen?id=${product.product_id}`)}
          activeOpacity={0.85}
        >
          <Image source={{ uri: imageUri }} style={styles.productThumbnail} />
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product?.product_name || 'Ordered Product'}
            </Text>
            <View style={styles.specsRow}>
              {variant?.product_color?.color ? (
                <View style={styles.specPill}>
                  <Text style={styles.specPillText}>{variant.product_color.color}</Text>
                </View>
              ) : null}
              {variant?.product_size?.size ? (
                <View style={styles.specPill}>
                  <Text style={styles.specPillText}>{variant.product_size.size}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.unitPriceText}>₱{unitPrice.toFixed(2)}</Text>
              <Text style={styles.itemQtyText}>x1</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tracking & Courier Info if available */}
        {(item.tracking_number || item.courier) && (
          <View style={styles.deliveryInfoRow}>
            <Feather name="truck" size={14} color="#666" />
            <Text style={styles.deliveryInfoText}>
              {item.courier || 'Express Delivery'}:{' '}
              <Text style={{ fontWeight: 'bold', color: '#333' }}>{item.tracking_number || 'Preparing parcel'}</Text>
            </Text>
          </View>
        )}

        {/* Card Footer with Total and Actions */}
        <View style={styles.orderCardFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.orderTotalLabel}>Order Total:</Text>
            <Text style={styles.orderTotalValue}>₱{totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.actionButtonsRow}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelOrder(item.id)}
                disabled={cancellingId === item.id}
              >
                {cancellingId === item.id ? (
                  <ActivityIndicator size="small" color="#b91c1c" />
                ) : (
                  <Text style={styles.cancelBtnText}>Cancel Order</Text>
                )}
              </TouchableOpacity>
            )}

            {item.status === 'delivered' && product?.product_id && (
              <TouchableOpacity
                style={styles.buyAgainBtn}
                onPress={() => router.push(`/ProductScreen?id=${product.product_id}`)}
              >
                <Text style={styles.buyAgainBtnText}>Buy Again</Text>
              </TouchableOpacity>
            )}

            {item.status === 'shipped' && (
              <View style={styles.shippedNotice}>
                <Ionicons name="airplane-outline" size={14} color={Colors.primary} />
                <Text style={styles.shippedNoticeText}>In Transit</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Status Filter Scrollable Tabs */}
      <View style={styles.tabBarContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(t) => t.key}
          contentContainerStyle={styles.tabListContent}
          renderItem={({ item }) => {
            const isActive = selectedTab === item.key;
            return (
              <TouchableOpacity
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setSelectedTab(item.key)}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List / Loading / Empty State */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingLabel}>Loading your orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="package-variant-closed" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            {selectedTab === 'all'
              ? "You haven't placed any orders on Wagon yet."
              : `You have no ${selectedTab} orders at the moment.`}
          </Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.browseButtonText}>Explore Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.orderListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  tabBarContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabListContent: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  orderListContent: {
    padding: 12,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.title,
    marginLeft: 6,
  },
  orderDateText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderBodyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  productThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.title,
    lineHeight: 18,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  specPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  specPillText: {
    fontSize: 11,
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.title,
  },
  itemQtyText: {
    fontSize: 12,
    color: '#888',
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  deliveryInfoText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 6,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  orderTotalLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.title,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
  },
  buyAgainBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  buyAgainBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  shippedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  shippedNoticeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.subtitle,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f3ece7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.title,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.subtitle,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
