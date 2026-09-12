import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { useAddress } from '@/context/AddressProvider';
import { AddressProps } from '@/types/types';
import { getAddresses, setDefaultAddress, deleteAddress } from '@/data/data';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

const AddressScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const { addresses, setAddresses } = useAddress();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetched = await getAddresses(userId);
    setAddresses(fetched);
    setLoading(false);
    setRefreshing(false);
  }, [userId, setAddresses]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const handleSetDefault = async (addressId?: string) => {
    if (!addressId || !userId) return;

    // Optimistic UI update
    const previous = [...addresses];
    const optimistic = addresses.map((addr) => ({
      ...addr,
      prefer: addr.id === addressId,
    }));
    setAddresses(optimistic);

    setActionLoadingId(addressId);
    const success = await setDefaultAddress(userId, addressId);
    setActionLoadingId(null);

    if (!success) {
      // Revert if failed
      setAddresses(previous);
      Alert.alert('Error', 'Failed to update default address. Please try again.');
    }
  };

  const handleEdit = (addressId?: string) => {
    if (!addressId) return;
    router.push(`/AddEditAddress?id=${addressId}`);
  };

  const handleDelete = (address: AddressProps) => {
    if (!address.id) return;

    Alert.alert(
      'Delete Address',
      `Are you sure you want to remove the address for "${address.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(address.id!);
            const success = await deleteAddress(address.id!);
            setActionLoadingId(null);

            if (success) {
              const remaining = addresses.filter((a) => a.id !== address.id);
              // If deleted address was the default and others remain, set first as default
              if (address.prefer && remaining.length > 0 && userId && remaining[0].id) {
                remaining[0].prefer = true;
                await setDefaultAddress(userId, remaining[0].id);
              }
              setAddresses(remaining);
              Alert.alert('Success', 'Address deleted successfully.');
            } else {
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AddressProps }) => {
    const isDefault = item.prefer === true;
    const isProcessing = actionLoadingId === item.id;

    return (
      <View style={[styles.card, isDefault && styles.cardDefault]}>
        {/* Top Header: Radio / Default badge + Address Title */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.defaultRadioBtn}
            onPress={() => handleSetDefault(item.id)}
            disabled={isDefault || isProcessing}
            activeOpacity={0.7}
          >
            <View style={[styles.radioOuter, isDefault && styles.radioOuterActive]}>
              {isDefault && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioLabel, isDefault && styles.radioLabelActive]}>
              {isDefault ? 'Default Address' : 'Set as Default'}
            </Text>
          </TouchableOpacity>

          {item.title ? (
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>{item.title}</Text>
            </View>
          ) : null}
        </View>

        {/* Recipient Information */}
        <View style={styles.recipientRow}>
          <Text style={styles.recipientName}>{item.name}</Text>
          <Text style={styles.recipientPhone}>• {item.phone}</Text>
        </View>

        {/* Detailed Address */}
        <View style={styles.addressBody}>
          <Ionicons name="location-outline" size={16} color="#78716c" style={styles.locationIcon} />
          <Text style={styles.addressText}>
            {item.house_number_street}, {item.barangay}, {item.city_municipality}, {item.province} {item.postal_code}
          </Text>
        </View>

        {/* Card Actions Footer */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleEdit(item.id)}
            disabled={isProcessing}
          >
            <Feather name="edit-2" size={14} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}
            disabled={isProcessing}
          >
            <Feather name="trash-2" size={14} color="#ef4444" />
            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerTitle: 'Delivery Addresses',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/AddEditAddress')}
              style={styles.headerAddBtn}
            >
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingLabel}>Loading your addresses...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item, index) => item.id || `address-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="location-outline" size={44} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Addresses Saved</Text>
              <Text style={styles.emptySubtitle}>
                Add your delivery address to enjoy fast 1-click checkout on your Wagon orders.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push('/AddEditAddress')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Bottom Add Button */}
      {!loading && addresses.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomAddBtn}
            onPress={() => router.push('/AddEditAddress')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bottomAddBtnText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f8f9',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerAddBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardDefault: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  defaultRadioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  radioLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  titleBadge: {
    backgroundColor: '#f3ece7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  titleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.title,
    marginRight: 8,
  },
  recipientPhone: {
    fontSize: 14,
    color: Colors.subtitle,
  },
  addressBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  actionDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.subtitle,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyAddBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bottomAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 26,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomAddBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
