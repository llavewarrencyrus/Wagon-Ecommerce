import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { FlatList, StatusBar, ScrollView, View, Text, StyleSheet, Pressable, Dimensions, Animated, Image, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
import MasonryList from '@react-native-seoul/masonry-list';
import DummySearch from '@/components/DummySearch';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import ProductCard from '@/components/ProductCard';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { getProducts } from '@/data/data';
import { Ionicons } from '@expo/vector-icons';

import { Product } from '@/types/types';

import NetworkIssue from '@/components/NetworkIssue';
import { useNetwork } from '@/components/NetworkContext';
import Promos from '@/components/Index/Promos';

const { width } = Dimensions.get('window');

const colours = ['#8291b0', '#d59876', '#beada5', '#ff9c9c'];

const banners = [{ uri: require('@/assets/images/banner1.jpg') }, { uri: require('@/assets/images/banner2.jpg') }, { uri: require('@/assets/images/banner3.jpg') }, { uri: require('@/assets/images/banner4.jpg') }]

export function HomeScreen() {
  const { isConnected, refreshNetworkStatus } = useNetwork();

  if (!isConnected) {
    return <NetworkIssue onRetry={refreshNetworkStatus} />;
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [headerColor, setHeaderColor] = useState(colours[0]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const [currentBarStyle, setCurrentBarStyle] = useState<'light-content' | 'dark-content'>('light-content');

  const [statusBarStyle, setStatusBarStyle] = useState<'light-content' | 'dark-content'>('light-content');

  const isFocused = useIsFocused();

  useEffect(() => {
    fetchProducts();
  }, []);


  const fetchProducts = async () => {
    const fetchedProducts = await getProducts();
    setProducts(fetchedProducts);
  };


  useEffect(() => {
    setStatusBarStyle(isFocused ? currentBarStyle : 'dark-content');
  }, [isFocused]);

  useEffect(() => {
    StatusBar.setBarStyle(statusBarStyle, true);
  }, [statusBarStyle]);

  const onRefresh = async () => {
    setRefreshing(true); // Set refreshing to true
    await fetchProducts(); // Fetch products again
    setRefreshing(false); // Reset refreshing state
  };

  const interpolatedColor = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [headerColor, '#fff'],
    extrapolate: 'clamp',
  });
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: interpolatedColor,
      },
      headerRight: () => <TouchableOpacity onPress={() => router.navigate('../Chat')} style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 15, borderRadius: 20 }}><Ionicons name="chatbubbles-outline" size={24} color="black" /></TouchableOpacity>,
    });
  }, [headerColor])

  useEffect(() => {

    const listener = scrollY.addListener(({ value }) => {
      setStatusBarStyle(value > 120 ? 'dark-content' : 'light-content');
      setCurrentBarStyle(value > 120 ? 'dark-content' : 'light-content')
    });
    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY]);

  const renderProductList = ({ item }: any) => {
    return (
      <View key={item.product_id + 'rend'} style={{ flex: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-around' }}>
        <ProductCard
          key={item.product_id}
          imageUri={item.product_image}
          title={item.product_name}
          price={item.product_price}
          id={item.product_id}
          discount={item.product_discount}
          rating={item.product_rating}
        />
      </View>
    )
  }

  return (
    <MasonryList
      ListHeaderComponent={
        <Promos colours={colours} banners={banners} products={products} setHeaderColor={setHeaderColor}/>
      }
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      data={products}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderProductList({ item })}
      refreshing={refreshing} // Add refreshing prop
      onRefresh={onRefresh} // Add onRefresh prop
    />
  );
}

const styles = StyleSheet.create({

});