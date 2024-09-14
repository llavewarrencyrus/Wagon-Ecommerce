import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Button } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function SellerProducts() {
    const navigation = useNavigation();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSeller, setIsSeller] = useState(false);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user) {
            Alert.alert("Error", "You must be logged in to access this page.");
            navigation.goBack(); // Redirect if not logged in
            return;
        }

        const userEmail = userData.user.email;

        if (userEmail === 'seller@wagon.com') {
            setIsSeller(true); // Allow access
            fetchProducts(); // Fetch products only if seller
        } else {
            Alert.alert("Access Denied", "You do not have permission to access this page.");
            navigation.goBack(); // Redirect if not the seller
        }
    }

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');

        if (error) {
            console.error('Error fetching products:', error.message);
            setLoading(false);
            return;
        }

        setProducts(data || []);
        setLoading(false);
    };

    const handleUpdateProduct = (productId: number) => {
        router.push(`../UpdateProduct/${productId}`);
    };

    const handleRemoveProduct = (productId: number) => {
        router.push(`../RemoveProduct/${productId}`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.productContainer}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text>Price: ${item.product_price}</Text>
            <Text>Quantity: {item.product_quantity}</Text>
            <Text>Color: {item.product_color}</Text>
            <Text>Size: {item.product_size}</Text>
            <Text>Material: {item.product_material}</Text>
            <Text>Dimensions: {item.product_length} x {item.product_width}</Text>
            <Text>Description: {item.product_description}</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Update Product"
                    onPress={() => handleUpdateProduct(item.id)}
                />
                <Button
                    title="Remove Product"
                    onPress={() => handleRemoveProduct(item.id)}
                />
            </View>
        </View>
    );

    if (!isSeller) {
        return <View><Text>Loading...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="tomato" />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text>No products found.</Text>}
                    style={styles.list}
                />
            )}

            <TouchableOpacity onPress={() => router.push('/AddProduct')} style={styles.floatingContainer}>
                <Ionicons name='add-circle' size={55} color={'brown'} style={styles.icon}/>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    list: {
        marginBottom: 0,
    },
    floatingContainer: {
        position: 'absolute',
        right: 20,
        bottom: 20,
    },
    icon: {
        opacity: 0.6, // Adjust opacity as needed (0 is fully transparent, 1 is fully opaque)
    },
    productContainer: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    buttonContainer: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});
