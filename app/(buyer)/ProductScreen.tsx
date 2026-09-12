import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, StatusBar, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import GalleryPreview from 'react-native-gallery-preview';

import { Colors } from '@/constants/Colors';
import { ProductScreenRouteProp } from '@/types/types';
import { getProductById } from '@/data/data';
import { getProducts } from '@/data/data';
import { Product } from '@/types/types';
import DummySearchBar from '@/components/DummySearch';
import Loading from '@/components/Loading';
import ProductList from '@/components/ProductList';
import ProductImage from '@/components/ProductScreen/ProductImage';
import ProductPreview from '@/components/ProductScreen/ProductPreview';
import ProductDescription from '@/components/ProductScreen/ProductDescription';
import ProductModal from '@/components/ProductScreen/AddToCart';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

function ProductScreen() {
    const [product, setProduct] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);

    const [colors, setColors] = useState<{ color: string; image: string }[]>([]);
    const [sizes, setSizes] = useState<{ size: string; dimension: string }[]>([]);

    const [priceNumber, setPriceNumber] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<number>(0);

    const [modalVisible, setModalVisible] = useState(false);
    const [imageVisible, setImageVisible] = useState(false);

    const [imageIndex, setImageIndex] = useState(0);
    const [prevImage, setPrevImage] = useState<{ uri: string; }[]>([]);



    const scrollY = useRef(new Animated.Value(0)).current;

    const route = useRoute<ProductScreenRouteProp>();
    const { id } = route.params;

    const router = useRouter();

    const navigation = useNavigation();

    const fetchProduct = async (id: string) => {
        const fetchedProduct = await getProductById(id);
        if (fetchedProduct) {
            setProduct(fetchedProduct[0]);
        } else {
            return (
                <View style={{ flex: 1 }}>
                    <Text>Product Not Found</Text>
                </View>
            );
        }
    };

    const fetchProducts = async () => {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
    };

    useEffect(() => {
        fetchProduct(id);
        fetchProducts();
    }, []);

    useEffect(() => {
        StatusBar.setBarStyle('dark-content', true);
    }, [StatusBar]);

    useEffect(() => {
        if (product && product.product_variant) {
            const uniqueColors = [
                ...new Map<string, string>(
                    product.product_variant.map((variant: any) => [
                        variant.product_color.color as string,
                        variant.product_color.image as string,
                    ])
                ).entries(),
            ].map(([color, image]) => ({ color, image }));

            setColors(uniqueColors);

            const uniqueSizes = [
                ...new Map<string, string>(
                    product.product_variant.map((variant: any) => [
                        variant.product_size.size as string,
                        variant.product_size.dimension as string,
                    ])
                ).entries(),
            ].map(([size, dimension]) => ({ size, dimension }));

            setSizes(uniqueSizes);
        }
    }, [product]);


    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }, 1000);
    }, [fadeAnim]);

    useEffect(() => {
        const headerBackgroundColor = scrollY.interpolate({
            inputRange: [120, 260],
            outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'],
            extrapolate: 'clamp',
        });
        const searchOpacity = scrollY.interpolate({
            inputRange: [120, 260],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
        const listener = scrollY.addListener(({ value }) => {
            const backgroundColor = value > 110 ? 'flex' : 'none';
            navigation.setOptions({
                headerTitle: () => <Animated.View style={{ display: backgroundColor, width: width * 0.65, opacity: searchOpacity }}><DummySearchBar /></Animated.View>,
                headerBackground: () => (
                    <Animated.View
                        style={{
                            flex: 1,
                            backgroundColor: headerBackgroundColor,
                        }}
                    />
                ),
            });
        });
        return () => scrollY.removeListener(listener);
    }, [navigation, scrollY]);

    const handleAddToCart = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleImage = (index: number) => {
        const prevImage = product?.product_image.map(url => ({ uri: url }));

        if (prevImage) {
            StatusBar.setBarStyle('light-content', true);
            setPrevImage(prevImage);
            setImageIndex(index);
            setImageVisible(true);
        }
    }

    const handleImageClose = () => {
        setPrevImage([]);
        setImageIndex(0);
        setImageVisible(false);
        setTimeout(() => {
            StatusBar.setBarStyle('dark-content', true);
        }, 100);
    }

    return (
        <>
            {product && product.product_image ? (
                <>
                    <ParallaxScrollView
                        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
                        headerImage={<ProductImage imageUris={product.product_image} onImagePress={handleImage} />}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                    >
                        <View style={{ backgroundColor: '#f2f2f2', marginBottom: 45 }}>
                            <ProductPreview product={product} setProductPrice={setPriceNumber} setDiscountedPrice={setFinalPrice} />
                            <ProductDescription colors={colors} sizes={sizes} />
                            <View style={styles.wrapper}>
                                <TouchableWithoutFeedback onPress={() => router.push('/UnderConstruction')}>
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                                            <Text style={{ fontSize: 18, color: Colors.title }}>Ratings & Review</Text>
                                            <TouchableOpacity onPress={() => router.push('/UnderConstruction')}>
                                                <Text style={{ color: Colors.subtitle }}>View All {'>'}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{ fontSize: 35 }}>{product.product_rating}</Text>
                                                <Text style={{ fontSize: 15, textAlignVertical: 'center', lineHeight: 35, color: Colors.tertiary }}>OUT OF 5</Text>
                                            </View>
                                            <View style={{ flexDirection: 'column' }}>
                                                <StarRatingDisplay rating={product.product_rating} starSize={20} color={Colors.star} starStyle={{ width: 12, height: '100%', }} />
                                                <Text style={{ color: Colors.tertiary, marginLeft: 'auto' }}>304 ratings</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                                <View style={{ flexDirection: 'column' }}>
                                    <View style={{ marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 14 }}>User 1</Text>
                                            <Text style={{ color: Colors.secondary }}> 08/23/2024 </Text>
                                        </View>
                                        <StarRatingDisplay rating={product.product_rating} starSize={14} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
                                        <Text style={{ color: Colors.secondary, marginBottom: 10 }}>Purchased: Black - XXL</Text>
                                        <Text>I am absolutely thrilled with my purchase! The product exceeded my expectations in every way. The quality is top-notch, and the attention to detail is remarkable. Shipping was prompt, and the customer service was exceptional. I will definitely be coming back for more. Highly recommend!</Text>
                                    </View>
                                    <View style={{ marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 14 }}>User 2</Text>
                                            <Text style={{ color: Colors.secondary }}> 08/23/2024 </Text>
                                        </View>
                                        <StarRatingDisplay rating={product.product_rating} starSize={14} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
                                        <Text style={{ color: Colors.secondary, marginBottom: 10 }}>Purchased: Black - XXL</Text>
                                        <Text>I am absolutely thrilled with my purchase! The product exceeded my expectations in every way. The quality is top-notch, and the attention to detail is remarkable. Shipping was prompt, and the customer service was exceptional. I will definitely be coming back for more. Highly recommend!</Text>
                                    </View>
                                    <View style={{ marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 14 }}>User 3</Text>
                                            <Text style={{ color: Colors.secondary }}> 08/23/2024 </Text>
                                        </View>
                                        <StarRatingDisplay rating={product.product_rating} starSize={14} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
                                        <Text style={{ color: Colors.secondary, marginBottom: 10 }}>Purchased: Black - XXL</Text>
                                        <Text>I am absolutely thrilled with my purchase! The product exceeded my expectations in every way. The quality is top-notch, and the attention to detail is remarkable. Shipping was prompt, and the customer service was exceptional. I will definitely be coming back for more. Highly recommend!</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={{ borderTopWidth: 1, borderColor: Colors.secondary }} onPress={() => router.push('/UnderConstruction')}>
                                    <Text style={{ color: Colors.secondary, marginHorizontal: 'auto', marginVertical: 10, }}>View More {'>'}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Product List */}
                            <ProductList products={products.filter((item) => item.product_id !== id)} />
                        </View>
                    </ParallaxScrollView>

                    <View style={styles.addCartWrapper}>
                        <TouchableOpacity onPress={handleAddToCart} style={styles.addCartBtn}>
                            <Text style={{ fontSize: 20, textAlign: 'center', color: 'white' }}>Add to Cart</Text>
                        </TouchableOpacity>
                        <ProductModal
                            visible={modalVisible}
                            onClose={closeModal}
                            colors={colors}
                            sizes={sizes}
                            variant={product.product_variant}
                            discount={product.product_discount}
                            discountPrice={finalPrice}
                            originalPrice={priceNumber}
                        />
                        <GalleryPreview
                            images={prevImage}
                            initialIndex={imageIndex}
                            isVisible={imageVisible}
                            onRequestClose={handleImageClose}
                        />
                    </View>
                    
                </>
            ) : (<Loading />)}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    wrapper: {
        marginTop: 10,
        backgroundColor: 'white',
        padding: 8
    },
    title: {
        width: '100%',
        fontSize: 20,
    },
    productPrice: {
        fontSize: 25,
        fontWeight: 'bold',
        marginLeft: 'auto'
    },
    originalPrice: {
        fontSize: 15,
        textAlignVertical: 'bottom',
        color: Colors.secondary,
        textDecorationLine: 'line-through',
        marginLeft: 'auto'
    },
    discountedPrice: {
        fontSize: 25,
        fontWeight: 'bold',
        color: Colors.discount,
        marginLeft: 'auto',
        marginRight: 0
    },
    dimensionsText: {
        color: Colors.primary,
    },
    productContainer: {
        width: (width / 2) - 8,
        paddingTop: 10,
        marginHorizontal: 'auto',
        flexDirection: 'column',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    modalOverlay: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end'
    },
    modalView: {
        position: 'absolute',
        bottom: 0,
        width: width,
        padding: 20,
        backgroundColor: 'white',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        fontSize: 18,
    },
    closeButton: {
        backgroundColor: Colors.button,
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        margin: 'auto',
        fontWeight: 'bold',
    },
    closeModal: {
        position: 'absolute',
        top: 7,
        right: 15,
        zIndex: 99
    },
    cartImage: {
        width: width / 3,
        height: ((width / 3) * 4) / 3,
        borderRadius: 10,
    },
    addCartWrapper: {
        position: 'absolute',
        bottom: 0,
        width: width,
        backgroundColor: 'white',
        borderWidth: 0.2,
        borderColor: Colors.secondary,
        paddingVertical: 10
    },
    addCartBtn: {
        width: width * 0.7,
        marginBottom: 'auto',
        marginHorizontal: 'auto',
        borderWidth: 0,
        borderRadius: 24,
        paddingVertical: 10,
        backgroundColor: Colors.button
    },
    buttonDisabled: {
        backgroundColor: Colors.buttonDisabled
    }
});

export default ProductScreen;