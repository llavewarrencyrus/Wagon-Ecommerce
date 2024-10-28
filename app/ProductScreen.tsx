import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, Animated, StatusBar, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Pressable } from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import MasonryList from '@react-native-seoul/masonry-list';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import ButtonMultiselect, { ButtonLayout } from 'react-native-button-multiselect';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import GalleryPreview from 'react-native-gallery-preview';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCard from '@/components/ProductCard';
import { Colors } from '@/constants/Colors';
import { ProductScreenRouteProp } from '@/types/types';
import { getProductById } from '@/data/data';
import { getProducts } from '@/data/data';
import { Product } from '@/types/types';
import DummySearchBar from '@/components/DummySearch';
import Loading from '@/components/Loading';

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

    const [colorBtn, setColorBtn] = useState<{ label: string; value: string }[]>([]);
    const [sizeBtn, setSizeBtn] = useState<{ label: string; value: string }[]>([]);

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedDimensions, setSelectedDimension] = useState<string | null>(null);

    const [cartImageDis, setCartImage] = useState<string>();
    const [cartStock, setCartStock] = useState<number>();

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

            const btnColors = uniqueColors.map(color => ({
                label: color.color,
                value: color.color
            }));

            setColorBtn(btnColors);

            const btnSizes = uniqueSizes.map(size => ({
                label: size.size,
                value: size.size
            }));

            setSizeBtn(btnSizes);

            const price = product.product_price;
            const fPrice = calculateDiscountedPrice(price, product.product_discount);

            setPriceNumber(price);
            setFinalPrice(fPrice);
        }
    }, [product]);

    const [background, setBackground] = useState('none');

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
            inputRange: [100, 250], 
            outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'], 
            extrapolate: 'clamp',
        });
        const listener = scrollY.addListener(({ value }) => {
            const backgroundColor = value > 220 ? 'flex' : 'none';
            if (backgroundColor === 'flex') {
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 90,
                    useNativeDriver: true,
                }).start();
            } else {
                fadeAnim.setValue(0); 
            }
            navigation.setOptions({
                headerTitle: () => <Animated.View style={{ display: backgroundColor, width: width * 0.65, opacity: fadeAnim }}><DummySearchBar /></Animated.View>,
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


    const calculateDiscountedPrice = (price: number, discount: number | undefined): number => {
        if (!discount) return price;

        return price * (1 - discount / 100);
    };

    const handleAddToCart = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const handleDisable = () => {
        return ((selectedSize && selectedColor) && cartStock !== 0) ? false : true;
    }

    const handleSizeSelected = (selectedValues: any) => {
        setSelectedSize(selectedValues);
        const selected = sizes.find(size => size.size === selectedValues);
        setSelectedDimension(selected ? selected.dimension : null);
    };

    const handleColorSelected = (selectedValues: any) => {
        setSelectedColor(selectedValues);
        const selected = colors.find(color => color.color === selectedValues);

        if (selected && selected.image) {
            setCartImage(selected.image);
        } else {
            setCartImage(undefined);
        }
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

    const sold = (num:number) => {
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
          return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
      };
    

    const StockCount: React.FC<{ color: string, size: string }> = ({ color, size }) => {
        const stocks = product?.product_variant.find(stock => stock.product_color.color === color && stock.product_size.size === size);

        useEffect(() => {
            setCartStock(stocks?.product_quantity);
        }, [stocks])

        return <Text style={{ color: Colors.secondary }}>Stock: {stocks?.product_quantity}</Text>;
    }

    const renderProductList = ({ item }: any) => {
        return (
            <View style={{ flex: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-around' }}>
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

    const ProductImage: React.FC<{ imageUris: string[] }> = ({ imageUris }) => {
        const [activeIndex, setActiveIndex] = useState(0);

        const onScroll = (event: any) => {
            const contentOffsetX = event.nativeEvent.contentOffset.x;
            const index = Math.floor(contentOffsetX / width);
            setActiveIndex(index);
        };

        return (
            <View style={styles.carouselContainer}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                >

                    {imageUris.map((item, index) => (
                        <Pressable key={index} onPress={() => handleImage(activeIndex)}>
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: item }} style={styles.productImage} />
                            </View>
                        </Pressable>
                    ))}

                </ScrollView>
                <View style={styles.pagination}>
                    <Text style={styles.paginationText}>
                        {activeIndex + 1}/{imageUris.length}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView>
            {product && product.product_image ? (
                <>
                    <ScrollView
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        style={{marginBottom:70}}
                    >
                        <ParallaxScrollView
                            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
                            headerImage={<ProductImage imageUris={product.product_image} />}>
                            <View style={{ backgroundColor: '#f2f2f2' }}>
                                <View style={{ backgroundColor: 'white', paddingBottom: 10 }}>
                                    {product.product_discount ? (
                                        <View style={styles.discountNotif}>
                                            <Text style={{ color: 'white' }}>DISCOUNT {product.product_discount} OFF</Text>
                                            <Text style={{ color: 'white' }}>Ends in 11/16/2024 16:00</Text>
                                        </View>
                                    ) : null}
                                    <View style={{ flexDirection: 'row', padding: 8, margin: 0 }}>
                                        <View style={{ width: (width * 0.55) - 8 }}>
                                            <Text style={styles.title}>{product.product_name}</Text>
                                            <View style={{ flexDirection: 'row', paddingTop: 3 }}>
                                                <StarRatingDisplay rating={product.product_rating} starSize={20} color={Colors.star} starStyle={{ width: 10, height: '100%' }} />
                                                <Text style={{ color: Colors.tertiary }}>  304 reviews  |</Text>
                                                <Text style={{ color: Colors.tertiary }}>  {sold(product.sales_count)} Sold</Text>
                                            </View>
                                        </View>
                                        <View style={{ flexDirection: 'column', width: (width * 0.45) - 8 }}>
                                            {product.product_discount ? (
                                                <>
                                                    <Text style={styles.discountedPrice}>₱{finalPrice.toFixed(2)}</Text>
                                                    <Text style={styles.originalPrice}>₱{priceNumber.toFixed(2)}</Text>

                                                </>
                                            ) : (
                                                <Text style={[styles.productPrice, { padding: 8 }]}>₱{priceNumber.toFixed(2)}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {product.product_description ? (
                                        <View style={{ paddingHorizontal: 8, margin: 0 }}>
                                            <Text>{product.product_description}</Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.productPrice, { padding: 8 }]}>₱{priceNumber.toFixed(2)}</Text>
                                    )}
                                </View>
                                <View style={styles.wrapper}>
                                    <Text style={{ fontSize: 18, marginBottom: 10, color: Colors.title }}>Product Description</Text>
                                    <View style={styles.productDesc}>
                                        <Text style={styles.descCategories}> Material: </Text>
                                        <Text> Cotton </Text>
                                    </View>
                                    <View style={styles.productDesc}>
                                        <Text style={styles.descCategories}> Color/s: </Text>
                                        <View style={{ justifyContent: 'space-around', flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {
                                                colors.map((item, index) => (
                                                    item ? <Text key={index}>{item.color} {colors.length - 1 == index ? null : ' |  '}</Text> : null
                                                ))
                                            }
                                        </View>
                                    </View>
                                    <View style={styles.productDesc}>
                                        <Text style={styles.descCategories}> Size/s: </Text>
                                        <View>
                                            {sizes.map((item, index) => (
                                                <Text key={index}>
                                                    {item.size}: {item.dimension}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.wrapper}>
                                    <TouchableWithoutFeedback onPress={() => router.push('../UnderConstruction')}>
                                        <View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                                                <Text style={{ fontSize: 18, color: Colors.title }}>Review</Text>
                                                <TouchableOpacity onPress={() => router.push('../UnderConstruction')}>
                                                    <Text style={{ color: Colors.subtitle }}>View All {'>'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <Text style={{ fontSize: 35 }}>{product.product_rating} </Text>
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
                                    <TouchableOpacity style={{ borderTopWidth: 1, borderColor: Colors.secondary }} onPress={() => router.push('../UnderConstruction')}>
                                        <Text style={{ color: Colors.secondary, marginHorizontal: 'auto', marginVertical: 10, }}>View More {'>'}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Product List */}
                                <MasonryList
                                    ListHeaderComponent={<Text style={{ paddingTop: 10, color: Colors.title }}>Similar Items</Text>}
                                    scrollEnabled={false}
                                    scrollEventThrottle={16}
                                    data={products}
                                    numColumns={2}
                                    keyExtractor={(item) => item.product_id}
                                    renderItem={({ item }) => renderProductList({ item })}
                                />
                            </View>
                        </ParallaxScrollView>
                    </ScrollView>
                    <View><Text>Testing...</Text></View>
                    <View style={styles.addCartWrapper}>
                        <TouchableOpacity onPress={handleAddToCart} style={styles.addCartBtn}>
                            <Text style={{ fontSize: 20, textAlign: 'center', color: 'white' }}>Add to Cart</Text>
                        </TouchableOpacity>
                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={modalVisible}
                            onRequestClose={closeModal}
                        >
                            <TouchableWithoutFeedback onPress={closeModal}>
                                <View style={styles.modalOverlay}>
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        style={styles.modalView}
                                        onPress={() => { }}
                                    >
                                        <TouchableOpacity style={styles.closeModal} onPress={closeModal}>
                                            <Text style={{ fontSize: 25, color: Colors.secondary }}>X</Text>
                                        </TouchableOpacity>

                                        <View style={{ height: '100%', width: '100%' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                {cartImageDis ? (<Image source={{ uri: cartImageDis }} style={styles.cartImage} />) : (<Image source={{ uri: product.product_image[0] }} style={styles.cartImage} />)}
                                                <View style={{ flexDirection: 'column', paddingHorizontal: 8, width: 'auto' }}>
                                                    <View style={{ flexDirection: 'column', width: 'auto' }}>
                                                        {product.product_discount ? (
                                                            <>
                                                                <Text style={styles.discountedPrice}>₱{finalPrice.toFixed(2)}</Text>
                                                                <Text style={[styles.originalPrice, { marginLeft: 0 }]}>₱{priceNumber.toFixed(2)}</Text>
                                                            </>
                                                        ) : (
                                                            <Text style={[styles.productPrice, { padding: 8 }]}>₱{priceNumber.toFixed(2)}</Text>
                                                        )}
                                                    </View>
                                                    {selectedSize && selectedColor && (
                                                        <StockCount color={selectedColor} size={selectedSize} />
                                                    )}
                                                </View>
                                            </View>
                                            <View>
                                                <View>
                                                    <Text style={{ paddingVertical: 10, color: Colors.text }}>Color:</Text>
                                                    <ButtonMultiselect
                                                        layout={ButtonLayout.GRID}
                                                        buttons={colorBtn}
                                                        selectedButtons={selectedColor}
                                                        onButtonSelected={handleColorSelected}
                                                        buttonStyle={{ padding: 100, margin: 0 }}
                                                        textStyle={{ fontSize: 14, padding: 0 }}
                                                        containerStyle={{ padding: 0 }}
                                                        selectedColors={{ backgroundColor: Colors.selectHighlight, borderColor: Colors.border, textColor: '#ffff' }}
                                                    />
                                                </View>
                                                <View>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                                                        <Text style={{ color: Colors.text }}>Size:</Text>
                                                        {selectedDimensions && (
                                                            <Text style={styles.dimensionsText}>{selectedDimensions}</Text>
                                                        )}
                                                    </View>
                                                    <ButtonMultiselect
                                                        layout={ButtonLayout.GRID}
                                                        buttons={sizeBtn}
                                                        selectedButtons={selectedSize}
                                                        onButtonSelected={handleSizeSelected}
                                                        buttonStyle={{ padding: 100, margin: 0 }}
                                                        textStyle={{ fontSize: 14, padding: 0 }}
                                                        containerStyle={{ padding: 0 }}
                                                        selectedColors={{ backgroundColor: Colors.selectHighlight, borderColor: Colors.border, textColor: '#ffff' }}
                                                    />
                                                </View>
                                                <View>
                                                    <TouchableOpacity
                                                        onPress={() => router.push(`../UnderConstruction`)}
                                                        disabled={handleDisable()}

                                                        style={[styles.closeButton,
                                                        handleDisable() ? styles.buttonDisabled : null
                                                        ]}
                                                    >
                                                        <Text style={styles.buttonText}>
                                                            {handleDisable() ?
                                                                'CHOOSE YOUR PREFERENCE' : 'ADD TO CART'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </Modal>
                        <GalleryPreview
                            images={prevImage}
                            initialIndex={imageIndex}
                            isVisible={imageVisible}
                            onRequestClose={handleImageClose}
                        />
                    </View>

                </>
            ) : (<Loading/>)}
        </SafeAreaView>
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
    carouselContainer: {
        width: '100%',
        alignItems: 'center',
    },
    imageContainer: {
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    pagination: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    paginationText: {
        color: Colors.primary,
        fontSize: 16,
    },
    dot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: Colors.secondary,
        margin: 5,
    },
    title: {
        width: '100%',
        fontSize: 20,
    },
    price: {
        fontSize: 20,
        color: Colors.secondary,
    },
    description: {
        fontSize: 16,
        marginVertical: 10,
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
    productDesc: {
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 6,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    descCategories: {
        color: Colors.secondary,
        fontSize: 14
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
    discountNotif: {
        width: width,
        backgroundColor: Colors.discount,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    section: {
        fontSize: 20,
        color: Colors.primary
    },
    addCartWrapper: {
        position:'absolute',
        bottom: 0,
        minHeight:90,
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