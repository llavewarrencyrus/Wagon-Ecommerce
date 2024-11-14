import React from 'react';
import { StyleSheet, FlatList, ScrollView, View, Text, Pressable, Image, TouchableOpacity, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Product } from '@/types/types';

const { width } = Dimensions.get('window');



interface PromosProps {
    colours: string[];
    banners: { uri: any }[];
    products: Product[];
    setHeaderColor: (color: string) => void; 
}

const Promos: React.FC<PromosProps> = ({ colours, banners, products, setHeaderColor }) => {
    const router = useRouter();

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const slideIndex = Math.round(xOffset / width);
        setHeaderColor(colours[slideIndex]);
    };

    return (
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
    );
};

const styles = StyleSheet.create({
    slide: {
        width: width,
        height: (width / 2) + 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: '100%',
        resizeMode: 'cover',
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
});

export default Promos;