import React, { useState } from 'react';
import { View, Image, Text, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import { Colors } from '@/constants/Colors';
import { ProductCardProps } from '@/types/types';

const { width } = Dimensions.get('window');

const calculateDiscountedPrice = (price: number, discount: number | undefined): number => {
  if (!discount) return price;

  return price * (1 - discount / 100);
};

const ProductCard: React.FC<ProductCardProps> = ({ imageUri, title, price, id, discount, rating }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const priceNumber = parseFloat(price);
  const finalPrice = calculateDiscountedPrice(priceNumber, discount);

  const onScroll = (event:any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.floor(contentOffsetX / width);
    setActiveIndex(index);
  };

  return (
    <View style={styles.productCard} >
      {discount ? (
        <View style={styles.discount}>
          <Text style={{ color: 'white' }}>{discount}% OFF</Text>
        </View>
      ) : (
        <View></View>
      )}

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {imageUri.map((item, index) => (
          <View key={index} style={styles.imageContainer}>
            <Pressable onPress={() => router.push(`../ProductScreen?id=${id}`)}>
              <Image source={{uri: item}} style={styles.productImage} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Pressable onPress={() => router.push(`../ProductScreen?id=${id}`)}>
        <View style={styles.productDesc}>
          <Text style={styles.productTitle} numberOfLines={2}>{title}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ color: Colors.star, width: 'auto' }}>{rating}</Text>
            <StarRatingDisplay rating={rating} starSize={15} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
          </View>
          {discount ? (
            <View >
              <Text style={styles.discountedPrice}>₱{finalPrice.toFixed(2)}</Text>
              <Text style={styles.originalPrice}>₱{priceNumber.toFixed(2)}</Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>₱{priceNumber.toFixed(2)}</Text>
          )}
        </View>
      </Pressable>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    width: (width / 2)- 8,
    height: 'auto',
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  imageContainer: {
    width: (width / 2) - 8,
    height: width * 0.60,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productDesc: {
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 15,
  },
  productTitle: {
    fontSize: 14,
    marginTop: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
    marginHorizontal: 4,
  },
  discount: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 10,
    paddingVertical: 5,
    backgroundColor: Colors.discount,
    zIndex: 99
  },
  originalPrice: {
    fontSize: 11,
    textAlignVertical: 'bottom',
    color: Colors.priceOriginal,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    paddingRight: 5,
    fontWeight: 'bold',
    color: Colors.discount,
  },
});

export default ProductCard;
