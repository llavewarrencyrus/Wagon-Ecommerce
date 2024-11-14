// CartScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartProvider';
import { getCartItems, removeFromCart, updateQuantity } from '@/data/data';
import { Colors } from '@/constants/Colors';
import { CartItemProps, Variant } from '@/types/types';
import CartItem from '@/components/CartScreen/CartList';
import UpdateModal from '@/components/CartScreen/UpdateCart';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const CartScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { cartItems, setCartItems } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0.00);
  const [variant, setVariant] = useState<CartItemProps>();
  const [variants, setVariants] = useState<Variant[] | null>();

  const [selectAll, setSelectAll] = useState<boolean>(false);

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

    const itemTotal = (price * (1 - discount / 100)) * quantity;

    setTotalAmount(prevTotal =>
      selectedItems.includes(id) ?
        prevTotal - itemTotal :
        prevTotal + itemTotal
    );
  };

  const toggleSelectAllItem = () => {
    if (selectAll) {
      // If all items are selected, deselect all
      setSelectedItems([]);
      setTotalAmount(0); // Reset total amount to 0 when deselecting all
      setSelectAll(false); // Update selectAll state to false
    } else {
      // If not all items are selected, select all
      const allItemIds = cartItems.map(item => item.variant_id); // Adjust this line based on your data structure
      const total = cartItems.reduce((acc, item) => {
        const itemTotal = (item.product_variant.products.product_price * (1 - item.product_variant.products.product_discount / 100)) * item.quantity;
        return acc + itemTotal;
      }, 0);
      
      setSelectedItems(allItemIds);
      setTotalAmount(total); // Set total amount to the sum of all selected items
      setSelectAll(true); // Update selectAll state to true
    }
  };

  const handleUpdateCart = (item: CartItemProps, variant: Variant[] | undefined | null) => {
    setVariants(variant);
    setVariant(item);
    setModalVisible(true);
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



  if (loading) {
    return <Text>Loading...</Text>;
  };

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty!</Text>
      ) : (
        <>
          <View style={{ paddingHorizontal: 18, backgroundColor: '#fff', paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableWithoutFeedback onPress={toggleSelectAllItem}>
                <MaterialIcons
                  name={selectAll ? 'check-box' : 'check-box-outline-blank'}
                  size={20}
                  color={selectAll ? Colors.button : Colors.icon}
                  style={styles.checkbox}
                />
              </TouchableWithoutFeedback>
              <Text style={{ fontSize: 16 }}>All</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {selectAll ? (
                <>
                  <Text style={{ fontSize: 14, textAlignVertical: 'center', color: 'red' }}>Delete</Text>
                  <Ionicons name='trash-outline' size={20} color='red' />
                </>
              ) : null}
            </View>
          </View>
          <FlatList
            data={cartItems}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                selectedItems={selectedItems}
                toggleSelectItem={toggleSelectItem}
                incrementQuantity={incrementQuantity}
                decrementQuantity={decrementQuantity}
                handleRemoveItem={handleRemoveItem}
                handleUpdateCart={handleUpdateCart}
              />
            )}
            keyExtractor={(item) => item.variant_id.toString()}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}
      <View style={styles.totalContainer}>
        <View>
          <Text style={styles.totalAmountText}>Total Amount</Text>
          <Text style={styles.totalText}>₱{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={handleCheckout} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
      {modalVisible ? (
        <UpdateModal
          visible={modalVisible}
          onClose={closeModal}
          variants={variants}
          variant={variant}
          price={variant?.product_variant.products.product_price}
          discount={variant?.product_variant.products.product_discount}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  totalContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.title,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.title,
  },
  checkoutButton: {
    backgroundColor: Colors.button,
    borderRadius: 30,
    alignItems: 'center',
    width: '50%',
  },
  checkoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    margin: 'auto'
  },
  checkbox: {
    marginRight: 8,
  },
});

export default CartScreen;