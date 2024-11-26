import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAddress } from '@/context/AddressProvider';
import { supabase } from '@/lib/supabase';
import { AddressProps, CartItemProps } from '@/types/types';
import { useCart } from '@/context/CartProvider';

import { getAddresses } from '@/data/data';

import { CheckOutScreenRouteProp } from '@/types/types';

const calculateTotalAmount = (items: CartItemProps[]): number => {
  let total = 0;

  if (Array.isArray(items)) {
    for (const item of items) {
      const { product_price, product_discount } = item.product_variant.products;
      const discountedPrice = product_price - (product_price * product_discount) / 100;
      total += discountedPrice * item.quantity;
    }
  }

  return total;
};

const CheckOutScreen = () => {
  const navigation = useNavigation();

  const { selectedPurchase, setSelectedPurchase } = useCart();

  const { addresses, setAddresses } = useAddress();
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(addresses[0].id);
  const [selectedAddress, setSelectedAddress] = useState<AddressProps[]>([]);
  const [loading, setLoading] = useState(false);

  const totalAmount = calculateTotalAmount(selectedPurchase);

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const preferredAddress = addresses.filter((address) => address.prefer === true);

      if (preferredAddress.length > 0) {
        setSelectedAddress(preferredAddress);
      } else {
        setSelectedAddress([addresses[0]]);
      }
    }
  }, [addresses]);

  const fetchAddresses = async () => {
    setLoading(true);

    const addresses = await getAddresses(selectedPurchase[0].user_id);

    setLoading(false);

    if (!addresses) {
      Alert.alert('Error', 'Failed to fetch addresses. Please try again.');
    } else {
      setAddresses(addresses);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert('Address Not Selected', 'Please select a delivery address.');
      return;
    }

    setLoading(true);
    try {
      const orderData = selectedPurchase.map(item => ({
        variant_id: item.variant_id,
        user_id: item.user_id,
        address_id: selectedAddressId,
      }));

      const { error } = await supabase.from('orders').insert(orderData);

      if (error) {
        Alert.alert('Checkout Failed', 'Something went wrong while processing your order.');
        console.error('Order error:', error.message);
      } else {
        Alert.alert('Success', 'Your order has been placed successfully!');
        setSelectedPurchase([]);
        navigation.goBack(); // Adjust navigation as needed
      }
    } catch (err) {
      console.error('Unexpected error during checkout:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Select Delivery Address</Text>
      {addresses.length > 0 ? (
        <View
          style={[
            styles.addressContainer,
            selectedAddressId === selectedAddress[0].id && styles.selectedAddress,
          ]}
          onTouchEnd={() => setSelectedAddressId(selectedAddress[0].id)}
        >
          <Text>{selectedAddress[0].name}</Text>
          <Text>{selectedAddress[0].phone}</Text>
          <Text>{selectedAddress[0].house_number_street}, {selectedAddress[0].barangay}</Text>
          <Text>{selectedAddress[0].city_municipality}, {selectedAddress[0].province}, {selectedAddress[0].postal_code}</Text>
        </View>

      ) : (
        <Text>No addresses available. Please add one in your account settings.</Text>
      )}

      <Text style={styles.heading}>Items in Checkout</Text>
      <FlatList
        data={selectedPurchase}
        keyExtractor={(item) => item.cart_id}
        renderItem={({ item }) => {
          const productVariant = item.product_variant;
          const product = productVariant?.products;

          if (!product) {
            return <Text style={{ color: 'red' }}>Invalid Product Data</Text>;
          }

          return (
            <View key={item.cart_id} style={styles.itemContainer}>
              <Text>{product.product_name}</Text>
              <Text>Quantity: {item.quantity}</Text>
              <Text>
                Price: $
                {(
                  product.product_price -
                  (product.product_price * product.product_discount) / 100
                ).toFixed(2)}
              </Text>
            </View>
          );
        }}
      />

      <Text style={styles.total}>Total: ${totalAmount.toFixed(2)}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Checkout" onPress={handleCheckout} />
      )}
    </View>
  );
};

export default CheckOutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addressContainer: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  selectedAddress: {
    borderColor: 'blue',
    borderWidth: 2,
  },
  itemContainer: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginVertical: 10,
  },
});
