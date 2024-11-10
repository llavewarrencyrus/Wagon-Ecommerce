import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Color {
    color: string;
    image: string;
}

interface Size {
    size: string;
    dimension: string;
}

interface ProductDescriptionProps {
    colors: Color[];
    sizes: Size[];
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ colors, sizes }) => {
    return (
        <View style={styles.wrapper}>
            <Text style={styles.title}>Product Description</Text>

            <View style={styles.productDesc}>
                <Text style={styles.descCategories}>Material:</Text>
                <Text>Cotton</Text>
            </View>

            <View style={styles.productDesc}>
                <Text style={styles.descCategories}>Color/s:</Text>
                <View style={styles.colorsContainer}>
                    {colors.map((item, index) => (
                        <Text key={index}>
                            {item.color}
                            {index < colors.length - 1 ? ' | ' : ''}
                        </Text>
                    ))}
                </View>
            </View>

            <View style={styles.productDesc}>
                <Text style={styles.descCategories}>Size/s:</Text>
                <View>
                    {sizes.map((item, index) => (
                        <Text key={index}>
                            {item.size}: {item.dimension}
                        </Text>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 10,
        backgroundColor: 'white',
        padding: 8
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        color: Colors.title,
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
    colorsContainer: {
        justifyContent: 'space-around',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});

export default ProductDescription;
