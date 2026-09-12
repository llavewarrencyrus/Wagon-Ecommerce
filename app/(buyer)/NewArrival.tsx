import React, { useState, useEffect } from "react";
import { View, Image, Dimensions } from "react-native";

import ProductList from "@/components/ProductList";
import { getProducts } from "@/data/data";

import { Product } from "@/types/types";

const { width } = Dimensions.get('window');

function NewArrival() {
    const [newProducts, setNewProducts] = useState<Product[]>([]);

    const fetchResults = async () => {
        const fetchedProducts = await getProducts({ sortBy: 'latest' });
        setNewProducts(fetchedProducts);
    };

    useEffect(() => {
        fetchResults()
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <Image source={require('@/assets/images/new.png')} style={{ width: width, height: width * (3 / 4), resizeMode: 'cover' }} />
            <View style={{flex:1, marginTop:-45}}>
                <ProductList products={newProducts} />
            </View>
        </View>
    );
}
export default NewArrival;