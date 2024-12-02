import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Button, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function SellerProducts() {
    const navigation = useNavigation();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSeller, setIsSeller] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [collapsedProducts, setCollapsedProducts] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
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
        } catch (err) {
            console.error("Error fetching user data:", err);
            Alert.alert("Error", "There was an issue fetching your user data.");
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('products').select('*');
            if (error) {
                console.error('Error fetching products:', error.message);
                setLoading(false);
                return;
            }
            setProducts(data || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching products:", err);
            setLoading(false);
        }
    };

    const handleUpdateProduct = (productId: number) => {
        router.push(`../UpdateProduct/${productId}`);
    };

    const handleRemoveProduct = (productId: number) => {
        router.push(`../RemoveProduct/${productId}`);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProducts();
        setRefreshing(false);
    };

    // Toggle the expanded state for the product
    const toggleProductDetails = (productId: number) => {
        setCollapsedProducts((prevState) => ({
            ...prevState,
            [productId]: !prevState[productId], // Toggle the collapse state for the clicked product
        }));
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.productContainer}>
            <TouchableOpacity onPress={() => toggleProductDetails(item.id)}>
                <Text style={styles.productName}>{item.product_name}</Text>
            </TouchableOpacity>

            {/* Conditionally render product details based on collapse state */}
            {collapsedProducts[item.id] ? (
                <View style={styles.productDetailsContainer}>
                    <Text style={styles.productDetails}>Price: ${item.product_price}</Text>
                    <Text style={styles.productDetails}>Quantity: {item.product_quantity}</Text>
                    <Text style={styles.productDetails}>Color: {item.product_color}</Text>
                    <Text style={styles.productDetails}>Size: {item.product_size}</Text>
                    <Text style={styles.productDetails}>Material: {item.product_material}</Text>
                    <Text style={styles.productDetails}>Dimensions: {item.product_length} x {item.product_width}</Text>
                    <Text style={styles.productDescription}>Description: {item.product_description}</Text>
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Update Product"
                            onPress={() => handleUpdateProduct(item.id)}
                            color="#9C6F56"
                        />
                        <Button
                            title="Remove Product"
                            onPress={() => handleRemoveProduct(item.id)}
                            color="#9C3F2D" 
                        />
                    </View>
                </View>
            ) : null}
        </View>
    );

    if (!isSeller) {
        return <View><Text>Loading...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Products</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#8E6B52" />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id?.toString() || ''} // Ensure each item has a unique key
                    ListEmptyComponent={<Text>No products found.</Text>}
                    style={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#8E6B52']} // Color for the pull-to-refresh spinner
                        />
                    }
                />
            )}

            <TouchableOpacity onPress={() => router.push('/AddProduct')} style={styles.floatingContainer}>
                <Ionicons name='add-circle' size={55} color={styles.icon.color} style={styles.icon} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 0, // Adjust for consistency
        backgroundColor: '#f8f8f8',
    },
    header: {
        height: 60,
        backgroundColor: '#FFF', // White background like in the image
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5', // Subtle gray for bottom border
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000', // Black text for visibility
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
        opacity: 0.8,
        color: '#5C3A2E', // Primary color for the icon
    },
    productContainer: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
        borderRadius: 10,
        shadowColor: '#3E3228', // Shadow color
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#3E2B23', // Title color
    },
    productDetailsContainer: {
        marginTop: 10,
    },
    productDetails: {
        fontSize: 14,
        marginBottom: 4,
        fontWeight: 'bold',
        color: '#4A3027', // Text color for product details
    },
    productDescription: {
        fontSize: 14,
        marginBottom: 4,
        fontWeight: 'bold',
        color: '#4A3027', // Text color for description
    },
    buttonContainer: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    updateButton: {
        backgroundColor: '#5C3A2E', // Primary color for the update button
    },
    removeButton: {
        backgroundColor: '#9C3F2D', // Error color for the remove button
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
