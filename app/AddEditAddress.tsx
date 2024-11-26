import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { AddressScreenRouteProp } from '@/types/types';
import { useAddress } from '@/context/AddressProvider';

import { AddressProps } from '@/types/types';
import { udpateAddress } from '@/data/data';

const AddEditAddressScreen: React.FC = () => {
    const { user } = useAuth();
    const userId = user?.id;

    const { addresses, setAddresses } = useAddress();

    const [address, setAddress] = useState<AddressProps>({
        user_id: userId,
        name: '',
        phone: '',
        house_number_street: '',
        barangay: '',
        city_municipality: '',
        province: '',
        postal_code: '',
        prefer: false,
    });
    const [isEnabled, setIsEnabled] = useState<boolean>(address.prefer);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const route = useRoute<AddressScreenRouteProp>();
    const addressId = route.params?.id;  // If we're editing an address, we get the address ID.

    useEffect(() => {
        if (addressId) {
            fetchAddress(addressId);  // Fetch existing address for editing
        }
    }, [addressId]);

    useEffect(() => {
        if (addresses.length < 1) {
            setAddress({ ...address, prefer: true })
        }
    }, [addresses]);

    const fetchAddress = async (id: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', id)
            .single();

        setLoading(false);

        if (error) {
            Alert.alert('Error', 'Failed to fetch address. Please try again.');
            console.error('Error fetching address:', error.message);
        } else {
            setAddress(data);
        }
    };

    const handleSave = async () => {
        setLoading(true);

        if (addressId) {
            // If editing, update the existing address
            const update = await udpateAddress(address, addressId);

            if (!update) {
                Alert.alert('Error', 'Failed to update address. Please try again.');
            } else {
                const updatedAddresses = addresses.map((item) =>
                    item.id === addressId ? { ...item, ...address } : item
                );
                setAddresses(updatedAddresses);
                Alert.alert('Success', 'Address updated successfully.');
                navigation.goBack();
            }
        } else {
            // If adding a new address
            const { data, error } = await supabase
                .from('addresses')
                .insert([address])
                .select();

            if (error) {
                Alert.alert('Error', 'Failed to add address. Please try again.');
                console.error('Error adding address:', error.message);
            } else {
                setAddresses([...addresses, ...data]);
                Alert.alert('Success', 'Address added successfully.');
                navigation.goBack();
            }
        }

        setLoading(false);
    };

    const toggleSwitch = () => {
        setIsEnabled(previousState => !previousState)
        setAddress({ ...address, prefer: !isEnabled })
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{addressId ? 'Edit Address' : 'Add New Address'}</Text>
            <Text>Contact</Text>
            <TextInput
                style={styles.input}
                value={address.name}
                onChangeText={(text) => setAddress({ ...address, name: text })}
                placeholder="Name"
            />
            <TextInput
                style={styles.input}
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: text })}
                placeholder="Phone"
            />
            <Text>Address</Text>
            <TextInput
                style={styles.input}
                value={address.house_number_street}
                onChangeText={(text) => setAddress({ ...address, house_number_street: text })}
                placeholder="House Number / Street"
            />
            <TextInput
                style={styles.input}
                value={address.barangay}
                onChangeText={(text) => setAddress({ ...address, barangay: text })}
                placeholder="Barangay"
            />
            <TextInput
                style={styles.input}
                value={address.city_municipality}
                onChangeText={(text) => setAddress({ ...address, city_municipality: text })}
                placeholder="City / Municipality"
            />
            <TextInput
                style={styles.input}
                value={address.province}
                onChangeText={(text) => setAddress({ ...address, province: text })}
                placeholder="Province"
            />
            <TextInput
                style={styles.input}
                value={address.postal_code}
                onChangeText={(text) => setAddress({ ...address, postal_code: text })}
                placeholder="Postal Code"
                keyboardType="numeric"
            />
            <View style={{flexDirection:'row'}}>
                <Text>Default Address</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={address.prefer ? '#f5dd4b' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitch}
                    value={address.prefer}
                />
            </View>


            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>{addressId ? 'Save Changes' : 'Add Address'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

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
    input: {
        height: 45,
        borderColor: '#CCC',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 12,
        paddingLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddEditAddressScreen;
