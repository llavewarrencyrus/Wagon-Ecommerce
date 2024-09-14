import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, StatusBar, ScrollView, View, Text, StyleSheet, Pressable, Dimensions, Animated, Image, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';
import DummySearch from '@/components/DummySearch';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import ProductCard from '@/components/ProductCard';
import { products } from '@/components/products';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

const colours = ['#8291b0', '#d59876', '#beada5', '#ff9c9c'];

const banners = [{ uri: require('@/assets/images/banner1.jpg') }, { uri: require('@/assets/images/banner2.jpg') }, { uri: require('@/assets/images/banner3.jpg') }, { uri: require('@/assets/images/banner4.jpg') }]

interface ProductWrapperProps {
  children: ReactNode;
}

const ProductWrapper: React.FC<ProductWrapperProps> = ({ children }) => {
  return <View style={styles.productContainer}>{children}</View>;
};

export default function HomeScreen() {
  const [headerColor, setHeaderColor] = useState(colours[0]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const router = useRouter();

  const [currentBarStyle, setCurrentBarStyle] = useState<'light-content' | 'dark-content'>('light-content');

  const [statusBarStyle, setStatusBarStyle] = useState<'light-content' | 'dark-content'>('light-content');

  const isFocused = useIsFocused();

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

  const interpolatedColor = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [headerColor, '#fff'],
    extrapolate: 'clamp',
  });
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => <View style={{ width: width * 0.9 }}><DummySearch /></View>,
      headerStyle: {
        backgroundColor: interpolatedColor,
      },
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

  const oddProducts = products.filter((_, index) => index % 2 === 0);
  const evenProducts = products.filter((_, index) => index % 2 !== 0);

  return (
    <View style={{ flex: 1, flexDirection: 'column', marginTop: -30 }}>
      <ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            showsHorizontalScrollIndicator={false}
          >
            {banners.map((item, index) => (
              <Pressable key={index} onPress={()=>router.push('../UnderConstruction')}>
                <View style={[styles.slide, { backgroundColor: colours[index] }]}>
                  <Image source={item.uri} style={styles.image} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* New Arrival */}
        <View style={styles.featureWrapper}>
          <View style={styles.featureContainer}>
            <Text style={styles.title}>New Arrival</Text>
            <TouchableOpacity style={{marginVertical:'auto'}} onPress={() => router.push('../UnderConstruction')}>
              <Text style={styles.more}>View More {'>'} </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {products.slice(0, 4).map((item) => (
                <Pressable key={item.id} onPress={() => router.push(`../ProductScreen?id=${item.id}`)}>
                  <View key={item.id} style={styles.productContainerA}>
                    <Image source={item.imageUri[0].uri} style={styles.productImage} />
                    <Text style={[styles.productPrice, { color: item.discount ? Colors.discount : '#000' }]}>₱{item.price}</Text>
                  </View>
                </Pressable>
              ))}

              <TouchableOpacity onPress={() => router.push('../UnderConstruction')}>
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

        {/* Trends */}
        <View style={styles.featureWrapper}>
          <View style={styles.featureContainer}>
            <Text style={styles.title}>Trends</Text>
            <TouchableOpacity style={{marginVertical:'auto'}} onPress={() => router.push('../UnderConstruction')}>
              <Text style={styles.more}>View More {'>'} </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {products.slice(0, 4).map((item) => (
                <Pressable key={item.id} onPress={() => router.push(`../ProductScreen?id=${item.id}`)}>
                  <View key={item.id} style={styles.productContainerA}>
                    <Image source={item.imageUri[0].uri} style={styles.productImage} />
                    <Text style={[styles.productPrice, { color: item.discount ? Colors.discount : '#000' }]}>₱{item.price}</Text>
                  </View>
                </Pressable>
              ))}

              <TouchableOpacity onPress={()=>router.push('../UnderConstruction')}>
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

        {/* Product List */}
        <Text style={ [styles.title, {width: width - 8, margin: 'auto', marginTop: 10 }]}>Recommended</Text>
        <View style={{ width: width, flexDirection: 'row', alignItems: 'flex-start' }}>
          <ProductWrapper>
            {oddProducts.map((item) => (
              <ProductCard
                key={item.id}
                imageUri={item.imageUri}
                title={item.title}
                price={item.price}
                id={item.id}
                discount={item.discount}
                rating={item.rating}
              />
            ))}
          </ProductWrapper>

          <ProductWrapper>
            {evenProducts.map((item) => (
              <ProductCard
                key={item.id}
                imageUri={item.imageUri}
                title={item.title}
                price={item.price}
                id={item.id}
                discount={item.discount}
                rating={item.rating}
              />
            ))}
          </ProductWrapper>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: width,
    height: (width / 2) + 30,
    paddingTop: 30,
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
    width: (width / 2) - 8,
    paddingTop: 10,
    marginHorizontal: 'auto',
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  title:{
    fontSize: 20, 
    color: Colors.primary
  },
  more: { 
    color: Colors.secondary, 
    textAlignVertical: 'bottom' 
  },
  moreCard:{
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



// import React, { useState, useRef, useEffect } from 'react';
// import { View, StyleSheet, Dimensions, Animated, Text, Image, FlatList, ScrollView } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import DummySearch from '@/components/DummySearch';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/components/AuthContext';

// const { width } = Dimensions.get('window');

// const colours = ['#8291b0', '#d59876', '#beada5', '#ff9c9c'];

// const banners = [
//   { uri: require('@/assets/images/banner1.jpg') },
//   { uri: require('@/assets/images/banner2.jpg') },
//   { uri: require('@/assets/images/banner3.jpg') },
//   { uri: require('@/assets/images/banner4.jpg') }
// ];

// // Define the Product type
// interface Product {
//   id: number;
//   product_name: string;
//   product_image: string;
//   product_price: number;
// }

// const ProductCard = ({ imageUri, title, price }: { imageUri: string | string[], title: string, price: string }) => {
//   const images = Array.isArray(imageUri) ? imageUri : [imageUri];

//   return (
//     <View style={styles.productCard}>
//       <ScrollView
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         style={styles.imageScrollView}
//       >
//         {images.map((uri, index) => (
//           <Image
//             key={index}
//             source={{ uri: uri || 'https://example.com/default-image.png' }}
//             style={styles.productImage}
//             onError={() => console.error(`Failed to load image: ${uri}`)}
//           />
//         ))}
//       </ScrollView>
//       <View style={styles.productDesc}>
//         <Text style={styles.productTitle} numberOfLines={1}>{title}</Text>
//         <Text style={styles.productPrice}>{price}</Text>
//       </View>
//     </View>
//   );
// };

// const HomeScreen = () => {
//   const { isAuthenticated } = useAuth();
//   const navigation = useNavigation();
//   const [products, setProducts] = useState<Product[]>([]); // Apply the Product type
//   const [loading, setLoading] = useState(true);
//   const [headerColor, setHeaderColor] = useState(colours[0]);
//   const scrollY = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     checkUser();
//   }, []);

//   const checkUser = async () => {
//     const { data: userData, error } = await supabase.auth.getUser();
//     if (error) {
//       console.error('Error fetching user:', error.message);
//       return;
//     }
//     fetchProducts();
//   };

//   const fetchProducts = async () => {
//     setLoading(true);

//     const { data, error } = await supabase.from('products').select('*');
//     console.log('Fetched Products:', JSON.stringify(data, null, 2));

//     if (error) {
//       console.error('Error fetching products:', error.message);
//       setLoading(false);
//       return;
//     }

//     setProducts(data || []);
//     setLoading(false);
//   };

//   const handleScroll = (event: any) => {
//     const xOffset = event.nativeEvent.contentOffset?.x || 0;
//     const slideIndex = Math.round(xOffset / width);
//     setHeaderColor(colours[slideIndex]);
//   };

//   const interpolatedColor = scrollY.interpolate({
//     inputRange: [0, 150],
//     outputRange: [headerColor, '#fff'],
//     extrapolate: 'clamp',
//   });

//   return (
//     <FlatList
//       ListHeaderComponent={
//         <>
//           <Animated.View style={[styles.header, { backgroundColor: interpolatedColor }]}>
//             <DummySearch />
//           </Animated.View>

//           <FlatList
//             horizontal
//             pagingEnabled
//             onScroll={handleScroll}
//             showsHorizontalScrollIndicator={false}
//             data={banners}
//             keyExtractor={(item, index) => `banner-${index}`}
//             renderItem={({ item, index }) => (
//               <View key={`banner-${index}`} style={[styles.slide, { backgroundColor: colours[index] }]}>
//                 <Image source={item.uri} style={styles.bannerImage} />
//               </View>
//             )}
//             style={styles.bannerContainer}
//             snapToAlignment='center'
//             decelerationRate='fast'
//             snapToInterval={width} //Ensures smooth snap between banners
//           />
//         </>
//       }
//       data={products}
//       keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//       renderItem={({ item }) => (
//         <ProductCard
//           imageUri={item.product_image}
//           title={item.product_name}
//           price={`${item.product_price}`}
//         />
//       )}
//       numColumns={2}  // Use numColumns for grid layout
//       contentContainerStyle={styles.productList}
//       ListFooterComponent={<View style={styles.footer} />} // Optional footer component
//       showsVerticalScrollIndicator={false}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: 100,
//     zIndex: 10,
//     paddingTop: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   bannerContainer: {
//     marginTop: 100,  // Ensure it's below the header
//   },
//   carousel: {
//     paddingTop: 100,
//     height: 330,
//     marginBottom: 50,
//   },
//   slide: {
//     width: width,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   bannerImage: {
//     width: width,
//     height: width * 0.5,  // Aspect ratio of 2:1 for better visuals
//     resizeMode: 'cover',
//     borderRadius: 10,  // Optional: rounded corners for a modern look
//     marginHorizontal: 10,  // Add spacing between banners
//   },
//   productList: {
//     paddingHorizontal: 10,
//     paddingTop: 10,
//   },
//   productCard: {
//     flex: 1,  // Flex to take equal space for each card
//     margin: 10,  // Add spacing between cards
//     borderRadius: 10,
//     backgroundColor: '#ffffff',
//     overflow: 'hidden',
//   },
//   imageScrollView: {
//     width: width * 0.5,
//     height: width * 0.6,
//   },
//   productImage: {
//     width: width * 0.5,
//     height: width * 0.6,
//     resizeMode: 'cover',
//   },
//   productDesc: {
//     paddingHorizontal: 10,
//     paddingTop: 3,
//     paddingBottom: 15,
//   },
//   productTitle: {
//     fontSize: 14,
//     color: '#888',
//     marginTop: 5,
//   },
//   productPrice: {
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   footer: {
//     height: 0, // Optional footer height
//   },
// });



// export default HomeScreen;
