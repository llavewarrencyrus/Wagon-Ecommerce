// CartScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartProvider";
import { getCartItems, removeFromCart, updateQuantity } from "@/data/data";
import { Colors } from "@/constants/Colors";
import { CartItemProps, Variant } from "@/types/types";
import CartItem from "@/components/CartScreen/CartList";
import UpdateModal from "@/components/CartScreen/UpdateCart";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Loading from "@/components/Loading";
import LottieView from "lottie-react-native";
import { SCREEN_WIDTH as width } from "@/constants/Layout";

const CartScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const { cartItems, setCartItems } = useCart();
  const { selectedPurchase, setSelectedPurchase } = useCart();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0.0);
  const [variant, setVariant] = useState<CartItemProps>();
  const [variants, setVariants] = useState<Variant[] | null>();

  const [selectAll, setSelectAll] = useState<boolean>(false);

  const [deleteItemModalVisible, setDeleteItemModalVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/LoginScreen");
    }
  }, [user]);

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

  useEffect(() => {
    setSelectAll(selectedItems.length === cartItems.length);
  }, [selectedItems, cartItems]);

  const handleRemoveItem = (id: string) => {
    setItemToDelete(id);
    setDeleteItemModalVisible(true);
  };

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      await removeFromCart(itemToDelete);
      setCartItems((prevItems) => prevItems.filter((item) => item.cart_id !== itemToDelete));
      setItemToDelete(null);
      setDeleteItemModalVisible(false);
    }
  };

  const toggleSelectItem = (id: string, price: number, discount: number, quantity: number) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((itemId) => itemId !== id) : [...prevSelected, id]
    );

    const itemTotal = price * (1 - discount / 100) * quantity;

    setTotalAmount((prevTotal) => {
      const newTotal = selectedItems.includes(id) ? prevTotal - itemTotal : prevTotal + itemTotal;
      return Math.max(0, parseFloat(newTotal.toFixed(2)));
    });
  };

  const toggleSelectAllItem = () => {
    if (selectAll) {
      setSelectedItems([]);
      setTotalAmount(0);
      setSelectAll(false);
    } else {
      const allItemIds = cartItems.map((item) => item.cart_id);
      const total = cartItems.reduce((acc, item) => {
        const itemTotal =
          item.product_variant.products.product_price *
          (1 - item.product_variant.products.product_discount / 100) *
          item.quantity;
        return acc + itemTotal;
      }, 0);

      setSelectedItems(allItemIds);
      setTotalAmount(total);
      setSelectAll(true);
    }
  };

  const deleteAll = () => {
    setDeleteAllModalVisible(true);
  };

  const confirmDeleteAll = async () => {
    await Promise.all(selectedItems.map((id) => removeFromCart(id)));
    setCartItems((prevItems) => prevItems.filter((item) => !selectedItems.includes(item.cart_id)));
    setSelectedItems([]);
    setTotalAmount(0);
    setSelectAll(false);
    setDeleteAllModalVisible(false);
  };

  const handleUpdateCart = (item: CartItemProps, variant: Variant[] | undefined | null) => {
    setVariants(variant);
    setVariant(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item to proceed to checkout.");
      return;
    }
    // Re-fetch fresh cart items so that all product fields (including seller_id) are up-to-date
    const freshItems = userId ? await getCartItems(userId) : cartItems;
    const itemstoCheckout = freshItems.filter((item: CartItemProps) => selectedItems.includes(item.cart_id));
    if (itemstoCheckout.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item to proceed to checkout.");
      return;
    }
    setCartItems(freshItems);
    setSelectedPurchase(itemstoCheckout);
    router.push("/CheckOutScreen");
  };

  const incrementQuantity = (item: CartItemProps) => {
    updateCartItemQuantity(item.cart_id, item.quantity + 1);
    if (selectedItems.includes(item.cart_id)) {
      setTotalAmount(
        (amount) =>
          amount +
          item.product_variant.products.product_price * (1 - item.product_variant.products.product_discount / 100)
      );
    }
  };

  const decrementQuantity = (item: CartItemProps) => {
    updateCartItemQuantity(item.cart_id, item.quantity - 1);
    if (selectedItems.includes(item.cart_id)) {
      setTotalAmount(
        (amount) =>
          amount -
          item.product_variant.products.product_price * (1 - item.product_variant.products.product_discount / 100)
      );
    }
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.cart_id === itemId ? { ...item, quantity: newQuantity } : item))
    );
    const quantity = async () => await updateQuantity(itemId, newQuantity);
    quantity();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Image
            source={require("@/assets/images/emptyCart.png")}
            style={{
              width: width * 0.55,
              height: width * 0.55,
              resizeMode: "contain",
              marginHorizontal: "auto",
              marginTop: 40,
            }}
          />
          <Text style={styles.emptyCartText}>Your cart is empty!</Text>
          <Text style={styles.emptyCartSubText}>Looks like you haven't added anything to your cart yet.</Text>
          <TouchableOpacity style={styles.startShoppingButton} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View
            style={{
              paddingHorizontal: 18,
              backgroundColor: "#fff",
              paddingBottom: 8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}>
            <View style={{ flexDirection: "row" }}>
              <TouchableWithoutFeedback onPress={toggleSelectAllItem}>
                <MaterialIcons
                  name={selectAll ? "check-box" : "check-box-outline-blank"}
                  size={20}
                  color={selectAll ? Colors.button : Colors.icon}
                  style={styles.checkbox}
                />
              </TouchableWithoutFeedback>
              <Text style={{ fontSize: 16 }}>All</Text>
            </View>
            <View>
              {selectedItems.length > 0 && (
                <TouchableOpacity onPress={deleteAll}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontSize: 14, textAlignVertical: "center", color: "red" }}>Delete All</Text>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="red"
                    />
                  </View>
                </TouchableOpacity>
              )}
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
            keyExtractor={(item) => item.cart_id.toString()}
            contentContainerStyle={styles.listContainer}
          />

          <View style={styles.totalContainer}>
            <View>
              <Text style={styles.totalAmountText}>Total Amount</Text>
              <Text style={styles.totalText}>₱{totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCheckout}
              style={styles.checkoutButton}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </TouchableOpacity>
          </View>
          {modalVisible && (
            <UpdateModal
              visible={modalVisible}
              onClose={closeModal}
              variants={variants}
              variant={variant}
              price={variant?.product_variant.products.product_price}
              discount={variant?.product_variant.products.product_discount}
            />
          )}
        </>
      )}
      {/* Delete Item Modal */}
      <Modal
        transparent={true}
        visible={deleteItemModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteItemModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning-outline"
              size={40}
              color="orange"
            />
            <Text style={styles.modalTitle}>Remove Item</Text>
            <Text style={styles.modalDescription}>Are you sure you want to remove this item from your cart?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteItemModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDeleteItem}>
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete All Modal */}
      <Modal
        transparent={true}
        visible={deleteAllModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteAllModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="trash-outline"
              size={40}
              color="red"
            />
            <Text style={styles.modalTitle}>Delete Selected Items</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete all selected items from your cart?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteAllModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDeleteAll}>
                <Text style={styles.buttonText}>Delete All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyCartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.title,
    marginTop: 18,
  },
  emptyCartSubText: {
    fontSize: 14,
    textAlign: "center",
    color: Colors.subtitle,
    marginTop: 8,
    marginBottom: 24,
  },
  startShoppingButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  startShoppingText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  totalContainer: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.title,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.title,
  },
  checkoutButton: {
    backgroundColor: Colors.button,
    borderRadius: 30,
    alignItems: "center",
    width: "50%",
  },
  checkoutText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    margin: "auto",
  },
  checkbox: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  modalDescription: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    marginRight: 5,
    backgroundColor: "#ccc",
    borderRadius: 5,
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    marginLeft: 5,
    backgroundColor: "red",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CartScreen;
