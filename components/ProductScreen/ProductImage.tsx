import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Text, Pressable } from 'react-native';

import { Colors } from '@/constants/Colors';
import { SCREEN_WIDTH as width } from '@/constants/Layout';

interface ProductImageProps {
    imageUris: string[];
    onImagePress: (index: number) => void;
}

const ProductImage: React.FC<ProductImageProps> = ({ imageUris, onImagePress }) => {
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
                    <Pressable key={index} onPress={() => onImagePress(activeIndex)}>
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

const styles = StyleSheet.create({
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
});

export default ProductImage;
