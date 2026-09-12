import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';

import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAddress } from '@/context/AddressProvider';

import { AddressProps } from '@/types/types';
import { getAddresses } from '@/data/data';


const AddressScreen: React.FC = () => {
  const { addresses, setAddresses } = useAddress();
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const userId = user?.id;

  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);

    const addresses = await getAddresses(userId);

    setLoading(false);

    if (!addresses) {
      Alert.alert('Error', 'Failed to fetch addresses. Please try again.');
    } else {
      setAddresses(addresses);
    }
  };

  const handleEdit = (addressId: string | undefined) => {
    router.push(`/AddEditAddress?id=${addressId}`);
  };

  const handleDelete = async (addressId: string | undefined) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this address?");
    if (confirmDelete) {
      setLoading(true);
      const { data, error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      setLoading(false);

      if (error) {
        Alert.alert('Error', 'Failed to delete address. Please try again.');
        console.error('Error deleting address:', error.message);
      } else {
        Alert.alert('Success', 'Address deleted successfully.');
        fetchAddresses(); // Refresh the address list
      }
    }
  };

  const renderItem = ({ item }: { item: AddressProps }) => (
    <View style={styles.addressItem}>
      <Text style={styles.addressText}>
        {item.title}
      </Text>
      <Text style={styles.addressText}>
        {item.house_number_street}, {item.barangay}, {item.city_municipality}, {item.province} - {item.postal_code}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => handleEdit(item.id)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Addresses</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id + item.house_number_street + item.postal_code}
            renderItem={renderItem}
            ListEmptyComponent={<Text>No addresses found. Add one!</Text>}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/AddEditAddress')}>
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default AddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  addressItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FF4C4C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
