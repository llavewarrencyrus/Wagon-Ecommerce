import React, { useState, useEffect } from 'react';

import { View, Text, Dimensions, Pressable, StyleSheet, Image, Button } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Stack } from 'expo-router';

import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';

import { getProducts } from '@/data/data';
import { Product } from '@/types/types';
import { ProductScreenRouteProp } from '@/types/types';
import { Colors } from '@/constants/Colors';
import ProductList from '@/components/ProductList';

import DummySearch from '@/components/DummySearch';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSort } from '@fortawesome/free-solid-svg-icons/';
import { faSortUp } from '@fortawesome/free-solid-svg-icons/';
import { faSortDown } from '@fortawesome/free-solid-svg-icons/';

import NetworkIssue from '@/components/NetworkIssue';
import { useNetwork } from '@/components/NetworkContext';

const { width } = Dimensions.get('window');

function Result() {
    const { isConnected, refreshNetworkStatus } = useNetwork();

    if (!isConnected) {
        return <NetworkIssue onRetry={refreshNetworkStatus} />;
    }

    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedSort, setSelectedSort] = useState<"relevance" | "latest" | "topSales" | "priceAsc" | "priceDesc" | undefined>('relevance');
    const [selectedSortOrder, setSelectedSortOrder] = useState<string>('asc');
    const [priceIcon, setPriceIcon] = useState(faSort);
    const [iconColor, setIconColor] = useState(Colors.tertiary);

    const route = useRoute<ProductScreenRouteProp>();
    const { keyword, category } = route.params;

    const sortBy = [
        { label: 'Relevance', value: 'relevance' },
        { label: 'Latest', value: 'latest' },
        { label: 'Price', value: 'price' },
    ];

    const categoriesArray = Array.isArray(category) ? category : category?.split(',');

    const fetchResults = async () => {
        setLoading(true);
        const fetchedProducts = await getProducts({ searchTerm: keyword, sortBy: selectedSort, category: category });
        setResults(fetchedProducts);
        setLoading(false);
    };

    useEffect(() => {
        fetchResults()
    }, []);

    useEffect(() => {
        fetchResults()
    }, [selectedSort]);

    const handleSortSelected = (selectedValues: any) => {
        if (selectedValues == 'price') {
            if (selectedSortOrder == 'asc') {
                setSelectedSort('priceAsc');
                setSelectedSortOrder('desc');
                setPriceIcon(faSortUp);
                
            } else {
                setSelectedSortOrder('asc');
                setSelectedSort('priceDesc');
                setPriceIcon(faSortDown);
            }
            setIconColor(Colors.title);
        } else {
            setIconColor(Colors.tertiary);
            setPriceIcon(faSort)
            setSelectedSort(selectedValues);
        }
    };

    const getRelevanceBtnStyle = () => ({
        color: selectedSort === 'relevance' ? Colors.title : Colors.tertiary,
    });
    const getLatestBtnStyle = () => ({
        color: selectedSort === 'latest' ? Colors.title : Colors.tertiary,
    });
    const getPriceBtnStyle = () => ({
        color: selectedSort === 'priceAsc' || selectedSort === 'priceDesc' ? Colors.title : Colors.tertiary,
    });

    if (!loading && results.length === 0) {
        return (
            <>
                <Stack.Screen options={{
                    headerTitle: () => <View style={{ width: width * 0.75 }}><DummySearch value={keyword} /></View>,
                    headerStyle: {
                        backgroundColor: 'white',
                    },
                    headerShadowVisible: false,
                }} />
                <View style={{ flex: 1, flexDirection: 'column', marginHorizontal: 'auto', marginTop: 50 }}>
                    <View style={{ margin: 20 }}>
                        <Image source={require('@/assets/images/no-results.png')} style={{ width: width / 3.5, height: width / 2.5, resizeMode: 'contain', marginHorizontal: 'auto' }} />
                        <Text style={{ fontSize: 20, margin: 'auto' }}>No Results for </Text>
                        <Text style={{ fontSize: 20, textAlign: 'center' }}>"{keyword}"</Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                headerTitle: () => <View style={{ width: width * 0.75 }}><DummySearch value={keyword} /></View>,
                headerStyle: {
                    backgroundColor: 'white',
                },
                headerShadowVisible: false,
            }} />
            {!loading ? (<>

                <View style={{ flex: 1 }}>
                    <View style={styles.sortWrapper}>
                        <Pressable onPress={() => handleSortSelected('relevance')}>
                            <Text style={[styles.sortBtn, getRelevanceBtnStyle()]}>Relevance</Text>
                        </Pressable>
                        <Pressable onPress={() => handleSortSelected('latest')}>
                            <Text style={[styles.sortBtn, getLatestBtnStyle()]}>Latest</Text>
                        </Pressable>
                        <Pressable onPress={() => handleSortSelected('price')}>
                            <Text style={[styles.sortBtn, getPriceBtnStyle()]}>Price <FontAwesomeIcon icon={priceIcon} color={iconColor}/></Text>
                        </Pressable>
                    </View>
                    <ProductList
                        products={results}
                    />
                </View></>) : (
                <LottieView
                    autoPlay
                    source={require('../assets/loader/load.json')}
                    style={{ width: '25%', height: '100%', margin: 'auto' }}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    sortWrapper: {
        flexDirection: 'row',
        width: width,
        paddingHorizontal: 8,
        paddingVertical: 15,
        justifyContent: 'space-around',
        backgroundColor: 'white',
    },
    sortBtn: {
        fontSize: 16,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    message: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
});

export default Result;