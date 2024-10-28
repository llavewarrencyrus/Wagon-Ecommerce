import { useState, useEffect } from 'react';
import { View, Animated } from 'react-native';

import MasonryList from '@react-native-seoul/masonry-list';

import ProductCard from './ProductCard';
import { ProductListProps } from '@/types/types';

const ProductList: React.FC<ProductListProps> = ({products, header, onScroll, scroll}) => {
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

    return (
        <MasonryList
            ListHeaderComponent={header}
            onScroll={onScroll}
            scrollEventThrottle={16}
            data={products}
            scrollEnabled={scroll}
            numColumns={2}
            keyExtractor={(item) => item.product_id}
            renderItem={({ item }) => renderProductList({ item })}
            showsVerticalScrollIndicator={false}
        />
    );
}

export default ProductList;