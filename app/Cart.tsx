// CartScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback
} from 'react-native';

import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartProvider';

import { getCartItems, removeFromCart, updateQuantity } from '@/data/data';
import { Colors } from '@/constants/Colors';
import { CartItemProps } from '@/types/types';
import UpdateModal from '@/components/CartScreen/UpdateCart';

const CartScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { cartItems, setCartItems } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // Track selected item IDs for checkout
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0.00);
  const [variant, setVariant] = useState<CartItemProps>();

  if (!user) {
    router.replace('../LoginScreen');
  }

  useEffect(() => {
    const fetchCartItems = async () => {
      if (userId) {
        try {
          const items = await getCartItems(userId);
          setCartItems(items);
        } catch (error) {
          console.error("Error fetching cart items:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [userId]);

  const handleRemoveItem = async (id: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item from your cart?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          await removeFromCart(id);
          setCartItems((prevItems) => prevItems.filter(item => item.variant_id !== id));
        },
      },
    ]);
  };

  const toggleSelectItem = (id: string, price: number, discount: number, quantity: number) => {
    setSelectedItems(prevSelected =>
      prevSelected.includes(id) ?
        prevSelected.filter(itemId => itemId !== id) :
        [...prevSelected, id]
    );
    { selectedItems.includes(id) ? setTotalAmount(amount => amount - ((price * (1 - discount / 100)) * quantity)) : setTotalAmount(amount => amount + ((price * (1 - discount / 100)) * quantity)) }
  };

  const handleUpdateCart = (item: CartItemProps) => {
    setModalVisible(true);

    setVariant(item);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleCheckout = () => {
    const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.variant_id));
    if (itemsToCheckout.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to proceed to checkout.');
      return;
    }
    router.push(`../CheckOut?item=${itemsToCheckout}`);
  };

  const incrementQuantity = (item: CartItemProps) => {
    updateCartItemQuantity(item.variant_id, (item.quantity + 1));
    { selectedItems.includes(item.variant_id) ? setTotalAmount(amount => amount + (item.product_variant.products.product_price * (1 - item.product_variant.products.product_discount / 100))) : null }
  };

  const decrementQuantity = (item: CartItemProps) => {
    updateCartItemQuantity(item.variant_id, (item.quantity - 1));
    { selectedItems.includes(item.variant_id) ? setTotalAmount(amount => amount - (item.product_variant.products.product_price * (1 - item.product_variant.products.product_discount / 100))) : null }
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.variant_id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    const quantity = async () => await updateQuantity(itemId, newQuantity);
    quantity();
  };

  const ProductPrice = ({ price, discount }: { price: number; discount?: number }) => {
    const calculateDiscountedPrice = (price: number, discount: number | undefined): number => {
      if (!discount) return price;
      return price * (1 - discount / 100);
    };

    const discountedPrice = calculateDiscountedPrice(price, discount);

    return (
      <>
        {discount ? (
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.discountedPrice}>₱{discountedPrice.toFixed(2)}</Text>
            <Text style={styles.originalPrice}>-{discount}%</Text>
          </View>
        ) : (
          <Text>₱{discountedPrice.toFixed(2)}</Text>
        )}
      </>
    );
  }


  const renderItem = ({ item }: { item: CartItemProps }) => (
    <View style={styles.cartItem}>
      <TouchableWithoutFeedback onPress={() => toggleSelectItem(item.variant_id, item.product_variant.products.product_price, item.product_variant.products.product_discount, item.quantity)}>
        <MaterialIcons
          name={selectedItems.includes(item.variant_id) ? 'check-box' : 'check-box-outline-blank'}
          size={20}
          color={selectedItems.includes(item.variant_id) ? Colors.button : Colors.icon}
          style={styles.checkbox}
        />
      </TouchableWithoutFeedback>
      <Image source={{ uri: item.product_variant.product_color.image }} style={styles.cartItemImage} />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemTitle} numberOfLines={1}>{item.product_variant.products.product_name}</Text>
        <View style={styles.cartItemPrice}>
          <ProductPrice price={item.product_variant.products.product_price} discount={item.product_variant.products.product_discount} />
          <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
            <Text style={styles.cartVar}>{item.product_variant.product_color.color}</Text>
            <Text style={styles.cartVar}>{item.product_variant.product_size.size}</Text>
          </View>
        </View>
        <View style={{ width: '100%', flexDirection: 'row' }}>
          <View style={styles.quantityContainer}>
            {(item.quantity < 2) ? (
              <TouchableOpacity style={[styles.quantityButton, { borderBottomLeftRadius: 4, borderTopLeftRadius: 4 }]} onPress={() => handleRemoveItem(item.variant_id)}>
                <Ionicons name='trash-outline' size={20} color='#fff' />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.quantityButton, { borderBottomLeftRadius: 4, borderTopLeftRadius: 4 }]} onPress={() => decrementQuantity(item)}>
                <Text style={styles.quantityText}>-</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity style={[styles.quantityButton, { borderBottomRightRadius: 4, borderTopRightRadius: 4 }]} onPress={() => incrementQuantity(item)}>
              <Text style={styles.quantityText}>+</Text>
            </TouchableOpacity>
          </View >
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', height: '100%' }}>
            <TouchableOpacity onPress={() => handleUpdateCart(item)}>
              <View style={{ flexDirection: 'row', }}>
                <Text style={{ textAlignVertical: 'top' }}>Edit  </Text>
                <View style={{ marginTop: 'auto' }}>
                  <FontAwesome name="edit" size={16} color='#000' />
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty!</Text>
      ) : (
        <FlatList
          data={cartItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.variant_id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total Amount: ${totalAmount.toFixed(2)}</Text>
        <TouchableOpacity onPress={handleCheckout} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
      {modalVisible ? (
        <UpdateModal
          visible={modalVisible}
          onClose={closeModal}
          product_id={variant?.product_variant.product_id}
          variant={variant}
        />
      ) : (
        null
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  emptyCartText: {
    fontSize: 18,
    textAlign: 'center',
    color: Colors.text,
    marginTop: 20,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.title,
  },
  cartItemPrice: {
    fontSize: 16,
    flexDirection: 'row',
    color: Colors.priceOriginal,
    marginTop: 4,
  },
  discountedPrice: {
    color: Colors.discount,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    textAlign: 'center',
    borderWidth: 0.8,
    borderRadius: 4,
    borderColor: Colors.discount,
    marginHorizontal: 6,
    paddingHorizontal: 3,
    color: Colors.discount,
  },
  quantityContainer: {
    width: '40%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: '30%',
    backgroundColor: Colors.buttonUnactive,
    padding: 4,
  },
  quantityText: {
    margin: 'auto',
    fontSize: 16,
    color: '#fff',
  },
  quantity: {
    width: '30%',
    padding: 4,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#D3D3D3'
  },
  removeButton: {
    marginTop: 8,
  },
  removeButtonText: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  totalContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.title,
  },
  checkoutButton: {
    marginTop: 16,
    backgroundColor: Colors.button,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  cartVar: {
    backgroundColor: '#D3D3D3',
    paddingHorizontal: 6,
    marginLeft: 5,
    borderRadius: 4
  }
});

export default CartScreen;
