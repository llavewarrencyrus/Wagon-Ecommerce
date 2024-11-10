import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, Animated, StatusBar, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Pressable } from 'react-native';

import { StarRatingDisplay } from 'react-native-star-rating-widget';

import { Colors } from '@/constants/Colors';
import { ProductPreviewProps } from '@/types/types';

const { width } = Dimensions.get('window');

function ProductPreview({ setProductPrice, setDiscountedPrice, product }: ProductPreviewProps) {
    const [priceNumber, setPriceNumber] = useState<number>(0);
    const [finalPrice, setFinalPrice] = useState<number>(0);

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

    const calculateDiscountedPrice = (price: number, discount: number | undefined): number => {
        if (!discount) return price;
        return price * (1 - discount / 100);
    };

    useEffect(() => {
        const price = product.product_price;
        const fPrice = calculateDiscountedPrice(price, product.product_discount);

        setPriceNumber(price);
        setFinalPrice(fPrice);

        setProductPrice(price);
        setDiscountedPrice(fPrice);
    }, []);

    const sold = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        }
        return num.toString();
    };
    
    const toggleDescription = () => {
        setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    return (
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
                <Text
                    numberOfLines={isDescriptionExpanded ? undefined : 3} // Show 3 lines initially
                    ellipsizeMode="tail" // Show "..." at the end if collapsed
                >
                    {product.product_description}
                </Text>

                {/* Show "More" button if description exceeds 3 lines */}
                {!isDescriptionExpanded && product.product_description.length > 100 && (
                    <TouchableOpacity onPress={toggleDescription}>
                        <Text style={styles.moreText}>More</Text>
                    </TouchableOpacity>
                )}
            </View>
            ) : (
                <Text style={[styles.productPrice, { padding: 8 }]}>₱{priceNumber.toFixed(2)}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
    discountNotif: {
        width: width,
        backgroundColor: Colors.discount,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    moreText: {
        color: Colors.button,
        marginTop: 5,
        fontSize: 14,
    },
});

export default ProductPreview;