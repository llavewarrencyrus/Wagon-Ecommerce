import React, { ReactNode, useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/components/types';
import { products } from '@/components/products';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import ButtonMultiselect, { ButtonLayout } from 'react-native-button-multiselect';
import { StarRatingDisplay } from 'react-native-star-rating-widget';
import ProductCard from '@/components/ProductCard';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';


const { width } = Dimensions.get('window');

type ProductScreenRouteProp = RouteProp<RootStackParamList, 'Product'>;

interface ProductWrapperProps {
  children: ReactNode;
}

const ProductWrapper: React.FC<ProductWrapperProps> = ({ children }) => {
  return <View style={styles.productContainer}>{children}</View>;
};

const ProductImage: React.FC<{ imageUris: { uri: string }[] }> = ({ imageUris }) => {
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
          <View key={index} style={styles.imageContainer}>
            <Image source={item.uri} style={styles.productImage} />
          </View>
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

const calculateDiscountedPrice = (price: number, discount: string | undefined): number => {
  if (!discount) return price;

  const discountValue = parseFloat(discount.replace('%', ''));

  return price * (1 - discountValue / 100);
};

const ProductScreen: React.FC = () => {
  const route = useRoute<ProductScreenRouteProp>();
  const { id } = route.params;

  const router = useRouter();

  const oddProducts = products.filter((_, index) => index % 2 === 0);
  const evenProducts = products.filter((_, index) => index % 2 !== 0);

  const findProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const product = findProductById(id);

  const buttons = [
    { label: 'XXL', value: 'XXL', dimensions: 'Length: 34", Width: 24"' },
    { label: 'XL', value: 'XL', dimensions: 'Length: 32", Width: 22"' },
    { label: 'L', value: 'L', dimensions: 'Length: 30", Width: 20"' },
    { label: 'M', value: 'M', dimensions: 'Length: 28", Width: 18"' },
    { label: 'S', value: 'S', dimensions: 'Length: 26", Width: 16"' },
    { label: 'XS', value: 'XS', dimensions: 'Length: 24", Width: 14"' },
  ];

  const [selectedButtons, setSelectedButtons] = useState<string | string[]>('');
  const [selectedColors, setSelectedColors] = useState<string | string[]>('');
  const [selectedDimensions, setSelectedDimensions] = useState<string | null>(null);

  const [cartImageDis, setCartImage] = useState();
  const [cartStock, setCardStock] = useState<String>('');

  const handleButtonSelected = (selectedValues: any) => {
    setSelectedButtons(selectedValues);
    const selected = buttons.find(button => button.value === selectedValues);
    setSelectedDimensions(selected ? selected.dimensions : null);
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Product Not Found</Text>
      </View>
    );
  }

  const imageUris = product.imageUri;

  const filteredImageUris = imageUris.filter(image => image.color && image.stock);

  const uniqueColors = Array.from(new Set(filteredImageUris.map(image => image.color)));

  const colors = uniqueColors.map(color => ({
    label: color.charAt(0).toUpperCase() + color.slice(1),
    value: color.charAt(0).toUpperCase() + color.slice(1)
  }));

  const handleColorsSelected = (selectedValues: any) => {
    setSelectedColors(selectedValues);

    if (product.imageUri) {
      const matchedItem = product.imageUri.find(item => item.color === selectedValues);
      if (matchedItem) {
        setCartImage(matchedItem.uri);
        setCardStock(matchedItem.stock);
        console.log(matchedItem.uri);
      } else {
        setCartImage(undefined);
      }
    } else {
      setCartImage(undefined);
    }
  };

  const priceNumber = parseFloat(product.price);
  const finalPrice = calculateDiscountedPrice(priceNumber, product.discount);

  const [modalVisible, setModalVisible] = useState(false);

  const handleAddToCart = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleDisable = () => {
    return ((selectedButtons && selectedColors) && cartStock != 'Out of Stock') ? false : true;
  }

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={<ProductImage imageUris={product.imageUri} />}>
        <View style={{ backgroundColor: '#f2f2f2' }}>
          <View style={{ backgroundColor: 'white', paddingBottom: 10 }}>
            {product.discount ? (
              <>
                <View style={styles.discountNotif}>
                  <Text style={{ color: 'white' }}>DISCOUNT {product.discount} OFF</Text>
                  <Text style={{ color: 'white' }}>Ends in 11/16/2024 16:00</Text>
                </View>
                <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
                  <Text style={styles.discountedPrice}>₱{finalPrice.toFixed(2)}</Text>
                  <Text style={styles.originalPrice}>₱{priceNumber.toFixed(2)}</Text>
                </View>
              </>
            ) : (
              <Text style={[styles.productPrice, { padding: 8 }]}>₱{priceNumber.toFixed(2)}</Text>
            )}
            <View style={{ padding: 8, margin: 0 }}>
              <Text style={styles.title}>{product.title}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15 }}>
                <Text>⭐{product.rating} {'('} 304 {')'}</Text>
                <Text> 2.3K Sold</Text>
              </View>
            </View>
          </View>
          <View style={styles.wrapper}>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Product Description</Text>
            <View style={styles.productDesc}>
              <Text style={styles.descCategories}> Material: </Text>
              <Text> Cotton </Text>
            </View>
            <View style={styles.productDesc}>
              <Text style={styles.descCategories}> Color/s: </Text>
              <View style={{ justifyContent: 'space-around', flexDirection: 'row', flexWrap: 'wrap' }}>
                {
                  colors.map((item, index) => (
                    item.value ? <Text key={index}>{item.value} {colors.length - 1 == index ? null : ' |  '}</Text> : null
                  ))
                }
              </View>
            </View>
            <View style={styles.productDesc}>
              <Text style={styles.descCategories}> Size/s: </Text>
              <View>
                {buttons.map((item, index) => (
                  <Text key={index}>
                    {item.value}: {item.dimensions}
                  </Text>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.wrapper}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
              <Text style={{ fontSize: 18 }}>Reviews {'('} 304 {')'}</Text>
              <TouchableOpacity onPress={() => router.push('../UnderConstruction')}>
                <Text style={{ color: Colors.secondary }}>View All {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <Text style={{ fontSize: 20 }}>{product.rating}</Text>
              <StarRatingDisplay rating={product.rating} starSize={25} color={Colors.star} starStyle={{ width: 12, height: '100%' }} />
            </View>
            <View style={{ flexDirection: 'column' }}>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14 }}>User 1</Text>
                  <Text style={{ color: Colors.secondary }}> 08/23/2024 </Text>
                </View>
                <StarRatingDisplay rating={product.rating} starSize={14} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
                <Text style={{ color: Colors.secondary, marginBottom: 10 }}>Purchased: Black - XXL</Text>
                <Text>I am absolutely thrilled with my purchase! The product exceeded my expectations in every way. The quality is top-notch, and the attention to detail is remarkable. Shipping was prompt, and the customer service was exceptional. I will definitely be coming back for more. Highly recommend!</Text>
              </View>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14 }}>User 2</Text>
                  <Text style={{ color: Colors.secondary }}> 08/23/2024 </Text>
                </View>
                <StarRatingDisplay rating={product.rating} starSize={14} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
                <Text style={{ color: Colors.secondary, marginBottom: 10 }}>Purchased: Black - XXL</Text>
                <Text>I am absolutely thrilled with my purchase! The product exceeded my expectations in every way. The quality is top-notch, and the attention to detail is remarkable. Shipping was prompt, and the customer service was exceptional. I will definitely be coming back for more. Highly recommend!</Text>
              </View>
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14 }}>User 3</Text>
                  <Text style={{ color: Colors.secondary }}> 08/23/2024 </Text>
                </View>
                <StarRatingDisplay rating={product.rating} starSize={14} color={Colors.star} starStyle={{ width: 0, height: '100%' }} />
                <Text style={{ color: Colors.secondary, marginBottom: 10 }}>Purchased: Black - XXL</Text>
                <Text>I am absolutely thrilled with my purchase! The product exceeded my expectations in every way. The quality is top-notch, and the attention to detail is remarkable. Shipping was prompt, and the customer service was exceptional. I will definitely be coming back for more. Highly recommend!</Text>
              </View>
            </View>
            <TouchableOpacity style={{borderTopWidth: 1, borderColor:Colors.secondary}} onPress={() => router.push('../UnderConstruction')}>
              <Text style={{ color: Colors.secondary, marginHorizontal:'auto', marginVertical:10,  }}>View All {'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Product List */}
          <Text style={[styles.section, { width: width - 8, margin: 'auto', marginTop: 10 }]}>Similar Items</Text>
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

        </View>
      </ParallaxScrollView>
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
                    {cartImageDis ? (<Image source={cartImageDis} style={styles.cartImage} />) : (<Image source={product.imageUri[0].uri} style={styles.cartImage} />)}
                    <View style={{ flexDirection: 'column', paddingHorizontal: 8, width: width * 0.9 }}>
                      {product.discount ? (
                        <>
                          <Text style={[styles.discountedPrice, {}]}>₱{finalPrice.toFixed(2)}</Text>
                          <Text style={styles.originalPrice}>₱{priceNumber.toFixed(2)}</Text>
                        </>
                      ) : (
                        <Text style={[styles.productPrice, { padding: 8, width: width * 0.9 }]}>₱{priceNumber.toFixed(2)}</Text>
                      )}
                      {selectedButtons && selectedColors && (
                        <Text style={{ color: Colors.secondary }}>Stock: {cartStock}</Text>
                      )}
                    </View>
                  </View>
                  <View>
                    <View>
                      <Text>Color:</Text>
                      <ButtonMultiselect
                        layout={ButtonLayout.GRID}
                        buttons={colors}
                        selectedButtons={selectedColors}
                        onButtonSelected={handleColorsSelected}
                        buttonStyle={{ padding: 100, margin: 0 }}
                        textStyle={{ fontSize: 14, padding: 0 }}
                        containerStyle={{ padding: 0 }}
                      />
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text>Size:</Text>
                        {selectedDimensions && (
                          <Text style={styles.dimensionsText}>{selectedDimensions}</Text>
                        )}
                      </View>
                      <ButtonMultiselect
                        layout={ButtonLayout.GRID}
                        buttons={buttons}
                        selectedButtons={selectedButtons}
                        onButtonSelected={handleButtonSelected}
                        buttonStyle={{ padding: 100, margin: 0 }}
                        textStyle={{ fontSize: 14, padding: 0 }}
                        containerStyle={{ padding: 0 }}
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
                        <Text style={styles.buttonText} >ADD TO CART</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </>
  );
};

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
    width: width * 0.85,
    fontSize: 15
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
  },
  originalPrice: {
    fontSize: 15,
    textAlignVertical: 'bottom',
    color: Colors.secondary,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 25,
    paddingRight: 5,
    fontWeight: 'bold',
    color: Colors.discount,
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
    backgroundColor: 'white',
    borderWidth: 0.2,
    borderColor: Colors.secondary,
    paddingVertical: 10
  },
  addCartBtn: {
    width: width * 0.7,
    margin: 'auto',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: Colors.button
  },
  buttonDisabled: {
    backgroundColor: Colors.secondary
  }
});

export default ProductScreen;
