import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAddress } from "@/context/AddressProvider";
import { useCart } from "@/context/CartProvider";
import { supabase } from "@/lib/supabase";
import { AddressProps, CartItemProps } from "@/types/types";
import { getAddresses, removeFromCart } from "@/data/data";
import { Colors } from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const calculateTotalAmount = (items: CartItemProps[]): number => {
  let total = 0;
  if (Array.isArray(items)) {
    for (const item of items) {
      const prod = item.product_variant?.products;
      if (prod) {
        const price = prod.product_price || 0;
        const discount = prod.product_discount || 0;
        const discountedPrice = price - (price * discount) / 100;
        total += discountedPrice * item.quantity;
      }
    }
  }
  return total;
};

const CheckOutScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const { selectedPurchase, setSelectedPurchase, setCartItems } = useCart();
  const { addresses, setAddresses } = useAddress();

  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [selectedAddress, setSelectedAddress] = useState<AddressProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash" | "card">("cod");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const subtotal = calculateTotalAmount(selectedPurchase);
  const shippingFee = subtotal > 1500 ? 0 : 50;
  const grandTotal = subtotal + shippingFee;

  useEffect(() => {
    if (userId) {
      fetchAddresses(userId);
    }
  }, [userId]);

  const fetchAddresses = async (uid: string) => {
    setLoading(true);
    const fetched = await getAddresses(uid);
    setLoading(false);

    if (fetched && fetched.length > 0) {
      setAddresses(fetched);
      const preferred = fetched.find((a) => a.prefer === true) || fetched[0];
      setSelectedAddress(preferred);
      setSelectedAddressId(preferred.id);
    }
  };

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      if (!selectedAddressId) {
        const preferred = addresses.find((a) => a.prefer === true) || addresses[0];
        setSelectedAddress(preferred);
        setSelectedAddressId(preferred.id);
      } else {
        const current = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
        setSelectedAddress(current);
      }
    }
  }, [addresses, selectedAddressId]);

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert("Delivery Address Required", "Please select or add a delivery address before placing your order.");
      return;
    }

    if (!selectedPurchase || selectedPurchase.length === 0) {
      Alert.alert("No Items", "There are no items to checkout.");
      router.back();
      return;
    }

    setLoading(true);
    try {
      const orderData = selectedPurchase.map((item) => {
        const prod = item.product_variant?.products as any;
        console.log("prod", prod);
        const sellerId = prod?.seller_id ?? null;
        if (!sellerId) {
          console.warn("Warning: seller_id is missing for product:", prod?.product_name);
        }
        return {
          variant_id: item.variant_id,
          user_id: item.user_id || userId,
          seller_id: sellerId,
          address_id: selectedAddressId,
          status: "pending",
          notes: `Payment: ${paymentMethod.toUpperCase()}`,
        };
      });

      const { error } = await supabase.from("orders").insert(orderData);

      if (error) {
        Alert.alert("Checkout Failed", error.message || "Something went wrong while processing your order.");
        console.error("Order error:", error.message);
      } else {
        // Automatically remove checked-out items from the user's cart
        for (const item of selectedPurchase) {
          if (item.cart_id) {
            await removeFromCart(item.cart_id);
          }
        }
        setCartItems((prev) => prev.filter((c) => !selectedPurchase.some((p) => p.cart_id === c.cart_id)));
        setSelectedPurchase([]);

        Alert.alert(
          "Order Placed! 🎉",
          "Your order has been placed successfully. You can track it in your Account orders.",
          [
            {
              text: "View Orders",
              onPress: () => router.replace("/Account"),
            },
            {
              text: "Continue Shopping",
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error("Unexpected error during checkout:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. Delivery Address Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="location-sharp"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/AddressScreen")}>
              <Text style={styles.changeActionText}>Change</Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressBody}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={styles.recipientName}>{selectedAddress.name}</Text>
                <Text style={styles.recipientPhone}>{selectedAddress.phone}</Text>
                {selectedAddress.prefer && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressLine}>
                {selectedAddress.house_number_street}, {selectedAddress.barangay}
              </Text>
              <Text style={styles.addressLine}>
                {selectedAddress.city_municipality}, {selectedAddress.province}, {selectedAddress.postal_code}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressPrompt}
              onPress={() => router.push("/AddEditAddress")}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={Colors.primary}
              />
              <Text style={styles.addAddressText}>Add a Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Order Items Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="bag-check-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Order Items ({selectedPurchase.length})</Text>
            </View>
          </View>

          {selectedPurchase.map((item, index) => {
            const variant = item.product_variant;
            const product = variant?.products;
            const imageUri =
              variant?.product_color?.image ||
              (product as any)?.product_image?.[0] ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";

            const price = product?.product_price || 0;
            const discount = product?.product_discount || 0;
            const unitPrice = discount > 0 ? price * (1 - discount / 100) : price;

            return (
              <View
                key={item.cart_id || index}
                style={[styles.itemRow, index > 0 && styles.itemBorderTop]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.itemThumbnail}
                />
                <View style={styles.itemInfo}>
                  <Text
                    style={styles.itemName}
                    numberOfLines={2}>
                    {product?.product_name || "Product"}
                  </Text>
                  <View style={styles.variantBadgeRow}>
                    {variant?.product_color?.color ? (
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillText}>{variant.product_color.color}</Text>
                      </View>
                    ) : null}
                    {variant?.product_size?.size ? (
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillText}>{variant.product_size.size}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>₱{unitPrice.toFixed(2)}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Payment Method Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
          </View>

          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "cod" && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod("cod")}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome5
                  name="money-bill-wave"
                  size={18}
                  color={paymentMethod === "cod" ? Colors.primary : "#666"}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.paymentTitle, paymentMethod === "cod" && styles.paymentTitleSelected]}>
                    Cash on Delivery (COD)
                  </Text>
                  <Text style={styles.paymentSubtitle}>Pay when your order arrives</Text>
                </View>
              </View>
              <Ionicons
                name={paymentMethod === "cod" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentMethod === "cod" ? Colors.primary : "#ccc"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === "gcash" && styles.paymentOptionSelected]}
              onPress={() => setPaymentMethod("gcash")}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="cellphone-check"
                  size={20}
                  color={paymentMethod === "gcash" ? Colors.primary : "#666"}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.paymentTitle, paymentMethod === "gcash" && styles.paymentTitleSelected]}>
                    GCash / E-Wallet
                  </Text>
                  <Text style={styles.paymentSubtitle}>Fast & secure online transfer</Text>
                </View>
              </View>
              <Ionicons
                name={paymentMethod === "gcash" ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={paymentMethod === "gcash" ? Colors.primary : "#ccc"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Payment Summary Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryValue}>
              {shippingFee === 0 ? (
                <Text style={{ color: "#2e7d32", fontWeight: "bold" }}>FREE</Text>
              ) : (
                `₱${shippingFee.toFixed(2)}`
              )}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>₱{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalContainer}>
          <Text style={styles.bottomTotalLabel}>Total Payment</Text>
          <Text style={styles.bottomTotalPrice}>₱{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleCheckout}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
            />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckOutScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.title,
    marginLeft: 6,
  },
  changeActionText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  addressBody: {
    paddingTop: 4,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.title,
    marginRight: 8,
  },
  recipientPhone: {
    fontSize: 14,
    color: Colors.subtitle,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  defaultBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
  addressLine: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginTop: 2,
  },
  addAddressPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    borderStyle: "dashed",
  },
  addAddressText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  itemBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  itemThumbnail: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.title,
  },
  variantBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 4,
  },
  pillBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  pillText: {
    fontSize: 11,
    color: "#666",
  },
  itemPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.title,
  },
  itemQuantity: {
    fontSize: 13,
    color: Colors.subtitle,
  },
  paymentOptions: {
    marginTop: 4,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#faf6f4",
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  paymentTitleSelected: {
    color: Colors.primary,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.title,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.discount || "#b91c1c",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    elevation: 8,
  },
  bottomTotalContainer: {
    flexDirection: "column",
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: "#666",
  },
  bottomTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.title,
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 25,
    elevation: 2,
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
