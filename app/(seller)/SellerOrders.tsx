import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getSellerOrders, updateOrderStatus } from '@/data/data';
import { SellerOrder, OrderStatus } from '@/types/types';
import { Colors } from '@/constants/Colors';

const STATUS_TABS: { label: string; key: 'all' | OrderStatus }[] = [
  { label: 'All', key: 'all' },
  { label: 'To Pack', key: 'pending' },
  { label: 'To Ship', key: 'processing' },
  { label: 'In Transit', key: 'shipped' },
  { label: 'Delivered', key: 'delivered' },
  { label: 'Cancelled', key: 'cancelled' },
];

export default function SellerOrders() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | OrderStatus>('all');

  // Modal for shipping/tracking input
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [courier, setCourier] = useState('J&T Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [user, selectedStatus]);

  const fetchOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getSellerOrders(user.id, selectedStatus);
      setOrders(data as SellerOrder[]);
    } catch (err) {
      console.error('Error loading seller orders:', err);
      Alert.alert('Error', 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleConfirmPack = async (order: SellerOrder) => {
    Alert.alert(
      'Confirm Packing',
      `Move Order #${order.id.slice(0, 8)} to "Processing / Packing"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateOrderStatus(order.id, 'processing');
              Alert.alert('Success', 'Order marked as Processing / Packing.');
              fetchOrders();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update order.');
            }
          },
        },
      ]
    );
  };

  const handleOpenShipModal = (order: SellerOrder) => {
    setSelectedOrder(order);
    setCourier(order.courier || 'J&T Express');
    setTrackingNumber(order.tracking_number || `WGN-${Date.now().toString().slice(-6)}`);
    setShippingNotes(order.notes || '');
    setModalVisible(true);
  };

  const handleConfirmShip = async () => {
    if (!selectedOrder) return;
    if (!trackingNumber.trim()) {
      Alert.alert('Validation', 'Please enter a tracking number.');
      return;
    }

    setSubmitting(true);
    try {
      await updateOrderStatus(
        selectedOrder.id,
        'shipped',
        trackingNumber.trim(),
        courier.trim(),
        shippingNotes.trim()
      );
      Alert.alert('Order Shipped', 'Order marked as In Transit with courier tracking.');
      setModalVisible(false);
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to ship order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async (order: SellerOrder) => {
    Alert.alert(
      'Complete Delivery',
      'Confirm that this order has been received by the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delivered',
          onPress: async () => {
            try {
              await updateOrderStatus(order.id, 'delivered');
              Alert.alert('Success', 'Order marked as Delivered.');
              fetchOrders();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete order.');
            }
          },
        },
      ]
    );
  };

  const handleCancelOrder = async (order: SellerOrder) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateOrderStatus(order.id, 'cancelled');
              Alert.alert('Order Cancelled', 'The order has been cancelled.');
              fetchOrders();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel order.');
            }
          },
        },
      ]
    );
  };

  const handleChatWithBuyer = (buyerId?: string) => {
    if (buyerId) {
      router.push({
        pathname: '/SellerChat',
        params: { senderId: buyerId },
      });
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'To Pack', bg: '#FFF3CD', text: '#856404' };
      case 'processing':
        return { label: 'To Ship', bg: '#CCE5FF', text: '#004085' };
      case 'shipped':
        return { label: 'In Transit', bg: '#D4EDDA', text: '#155724' };
      case 'delivered':
        return { label: 'Delivered', bg: '#D1ECF1', text: '#0C5460' };
      case 'cancelled':
        return { label: 'Cancelled', bg: '#F8D7DA', text: '#721C24' };
      default:
        return { label: status, bg: '#E2E3E5', text: '#383D41' };
    }
  };

  const renderOrderItem = ({ item }: { item: SellerOrder }) => {
    const statusInfo = getStatusBadge(item.status);
    const product = item.product_variant?.products;
    const color = item.product_variant?.product_color?.color;
    const size = item.product_variant?.product_size?.size;
    const price = product
      ? product.product_price * (1 - (product.product_discount || 0) / 100)
      : 0;
    const imageUri =
      item.product_variant?.product_color?.image ||
      (product?.product_image && product.product_image[0]) ||
      null;

    const address = item.addresses;

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={18} color="#5C3A2E" style={{ marginRight: 6 }} />
            <Text style={styles.orderIdText}>Order #{item.id.slice(0, 8)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.text }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Buyer Info Row */}
        <View style={styles.buyerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>
                {item.users?.username ? item.users.username.charAt(0).toUpperCase() : 'B'}
              </Text>
            </View>
            <Text style={styles.buyerName}>{item.users?.username || 'Buyer'}</Text>
          </View>
          <TouchableOpacity
            style={styles.chatBuyerBtn}
            onPress={() => handleChatWithBuyer(item.user_id)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#5C3A2E" />
            <Text style={styles.chatBuyerBtnText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Product Item Row */}
        <View style={styles.productRow}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.productThumb, styles.productThumbPlaceholder]}>
              <Ionicons name="image-outline" size={24} color="#999" />
            </View>
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>
              {product?.product_name || 'Product'}
            </Text>
            <View style={styles.variantChips}>
              {color ? <Text style={styles.variantChip}>Color: {color}</Text> : null}
              {size ? <Text style={styles.variantChip}>Size: {size}</Text> : null}
            </View>
            <Text style={styles.orderPrice}>
              ${price.toFixed(2)}{' '}
              <Text style={styles.qtyText}>x 1</Text>
            </Text>
          </View>
        </View>

        {/* Delivery Address Snapshot */}
        {address ? (
          <View style={styles.shippingBox}>
            <Ionicons name="location-outline" size={15} color="#666" style={{ marginRight: 4 }} />
            <Text style={styles.shippingText} numberOfLines={2}>
              {address.name} ({address.phone}) - {address.house_number_street}, {address.barangay},{' '}
              {address.city_municipality}, {address.province}
            </Text>
          </View>
        ) : null}

        {/* Tracking Details if Shipped */}
        {item.tracking_number ? (
          <View style={styles.trackingBox}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={16} color="#2E7D32" />
            <Text style={styles.trackingText}>
              Courier: <Text style={{ fontWeight: 'bold' }}>{item.courier || 'Standard'}</Text> | Tracking:{' '}
              <Text style={{ fontWeight: 'bold' }}>{item.tracking_number}</Text>
            </Text>
          </View>
        ) : null}

        {/* Actions Bar */}
        <View style={styles.actionsBar}>
          {item.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnCancel]}
                onPress={() => handleCancelOrder(item)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnPrimary]}
                onPress={() => handleConfirmPack(item)}
              >
                <Text style={styles.btnPrimaryText}>Confirm & Pack</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'processing' && (
            <>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnCancel]}
                onPress={() => handleCancelOrder(item)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnPrimary]}
                onPress={() => handleOpenShipModal(item)}
              >
                <FontAwesome5 name="shipping-fast" size={14} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnPrimaryText}>Add Tracking & Ship</Text>
              </TouchableOpacity>
            </>
          )}

          {item.status === 'shipped' && (
            <TouchableOpacity
              style={[styles.btnAction, styles.btnDelivered]}
              onPress={() => handleMarkDelivered(item)}
            >
              <Ionicons name="checkmark-done-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}

          {item.status === 'delivered' && (
            <View style={styles.completedTag}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
              <Text style={styles.completedTagText}>Order Fulfilled</Text>
            </View>
          )}

          {item.status === 'cancelled' && (
            <View style={styles.completedTag}>
              <Ionicons name="close-circle-outline" size={18} color="#D32F2F" />
              <Text style={[styles.completedTagText, { color: '#D32F2F' }]}>Order Cancelled</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Fulfillment</Text>
        <Text style={styles.headerSubtitle}>Manage, pack and ship customer orders</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setSelectedStatus(tab.key)}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
              >
                <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Order List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color="#C4B0A3" />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all'
                  ? 'Orders placed by buyers will appear here.'
                  : `There are currently no orders in "${selectedStatus}" status.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Ship & Tracking Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch & Ship Order</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={26} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Assign courier and tracking number for Order #{selectedOrder?.id?.slice(0, 8)}
            </Text>

            <Text style={styles.inputLabel}>Courier Service</Text>
            <View style={styles.courierRow}>
              {['J&T Express', 'LBC Express', 'Flash Express', 'NinjaVan'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.courierChip, courier === c && styles.courierChipActive]}
                  onPress={() => setCourier(c)}
                >
                  <Text style={[styles.courierChipText, courier === c && styles.courierChipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Tracking Number / Waybill</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. WGN-984712039"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />

            <Text style={styles.inputLabel}>Internal Notes (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="e.g. Fragile package packed in bubble wrap"
              value={shippingNotes}
              onChangeText={setShippingNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleConfirmShip}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Shipment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E1E17',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  tabsWrapper: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  tabsContainer: {
    paddingHorizontal: 15,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    marginRight: 8,
  },
  tabItemActive: {
    backgroundColor: '#5C3A2E',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabItemTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#5C3A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarMiniText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buyerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  chatBuyerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F5EBE6',
  },
  chatBuyerBtnText: {
    fontSize: 12,
    color: '#5C3A2E',
    fontWeight: '600',
    marginLeft: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  productThumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  variantChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  variantChip: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#EBEBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 2,
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5C3A2E',
    marginTop: 4,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#888',
  },
  shippingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9F9F9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  shippingText: {
    fontSize: 11,
    color: '#555',
    flex: 1,
    lineHeight: 16,
  },
  trackingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  trackingText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  btnAction: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  btnPrimary: {
    backgroundColor: '#5C3A2E',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  btnDelivered: {
    backgroundColor: '#2E7D32',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 35,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  modalSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  courierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  courierChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  courierChipActive: {
    backgroundColor: '#5C3A2E',
  },
  courierChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  courierChipTextActive: {
    color: '#FFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },
  modalSubmitBtn: {
    backgroundColor: '#5C3A2E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
