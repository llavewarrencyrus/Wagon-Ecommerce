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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(xOffset / width);
    setHeaderColor(colours[slideIndex]);
  };

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
        <>
          <FlatList
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            showsHorizontalScrollIndicator={false}
            data={banners}
            keyExtractor={(item, index) => `banner-${index}`}
            renderItem={({ item, index }) => (
              <Pressable key={`banner-${index}${item}`} onPress={() => router.push('../UnderConstruction')}>
                <View style={[styles.slide, { backgroundColor: colours[index] }]}>
                  <Image source={item.uri} style={styles.image} />
                </View>
              </Pressable>
            )}
            snapToAlignment='center'
            decelerationRate='fast'
            snapToInterval={width}
          />

          <View style={styles.featureWrapper}>
            <View style={styles.featureContainer}>
              <Text style={styles.title}>New Arrival</Text>
              <TouchableOpacity style={{ marginVertical: 'auto' }} onPress={() => router.push('../NewArrival')}>
                <Text style={styles.more}>View More {'>'} </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {products.slice(0, 4).map((item) => (
                  <Pressable key={item.product_id} onPress={() => router.push(`../ProductScreen?id=${item.product_id}`)}>
                    <View style={styles.productContainerA}>
                      <Image source={{ uri: item.product_image[0] }} style={styles.productImage} />
                      <Text style={[styles.productPrice, { color: item.product_discount ? Colors.discount : '#000' }]}>₱{item.product_price}</Text>
                    </View>
                  </Pressable>
                ))}

                <TouchableOpacity onPress={() => router.push('../NewArrival')}>
                  <View style={styles.productContainerA}>
                    <View style={[styles.productImage, { borderWidth: 1, borderColor: Colors.border }]}>
                      <View style={{ flex: 1, margin: 'auto', justifyContent: 'center' }}>
                        <Text style={styles.moreCard}>{'→'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.productPrice, { color: Colors.border }]}>View More</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          <View style={styles.featureWrapper}>
            <View style={styles.featureContainer}>
              <Text style={styles.title}>Top Sales</Text>
              <TouchableOpacity style={{ marginVertical: 'auto' }} onPress={() => router.push('../TopSales')}>
                <Text style={styles.more}>View More {'>'} </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {products.slice(0, 4).map((item) => (
                  <Pressable key={item.product_id} onPress={() => router.push(`../ProductScreen?id=${item.product_id}`)}>
                    <View style={styles.productContainerA}>
                      <Image source={{ uri: item.product_image[0] }} style={styles.productImage} />
                      <Text style={[styles.productPrice, { color: item.product_discount ? Colors.discount : '#000' }]}>₱{item.product_price}</Text>
                    </View>
                  </Pressable>
                ))}

                <TouchableOpacity onPress={() => router.push('../TopSales')}>
                  <View style={styles.productContainerA}>
                    <View style={[styles.productImage, { borderWidth: 1, borderColor: Colors.border }]}>
                      <View style={{ flex: 1, margin: 'auto', justifyContent: 'center' }}>
                        <Text style={styles.moreCard}>{'→'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.productPrice, { color: Colors.border }]}>View More</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </>
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
  slide: {
    width: width,
    height: (width / 2) + 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
  },
  image: {
    width: width,
    height: '100%',
    resizeMode: 'cover',
  },
  productList: {
    marginTop: 0,
  },
  productContainer: {
    width: width,
    paddingTop: 10,
    flexDirection: 'column',
  },
  productContainerA: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 4,
  },
  productImage: {
    width: (width / 3.5) - 15,
    height: (((width / 3.5) - 15) * 4) / 3,
    resizeMode: 'cover',
    marginBottom: 5,
    borderRadius: 10,
  },
  productPrice: {
    fontSize: 14,
    color: '#333',
  },
  featureWrapper: {
    width: width - 8,
    backgroundColor: 'white',
    margin: 'auto',
    marginTop: 10,
    paddingHorizontal: 10,
    borderRadius: 10
  },
  featureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5
  },
  title: {
    fontSize: 20,
    color: Colors.primary
  },
  more: {
    color: Colors.secondary,
    textAlignVertical: 'bottom'
  },
  moreCard: {
    fontSize: 20,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 5,
    borderRadius: 30,
    color: Colors.border,
    borderColor: Colors.border
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.primary,
    marginTop: 10,
  },
});