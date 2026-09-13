import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import { useCart } from "@/context/CartProvider";

import ButtonMultiselect, { ButtonLayout } from "react-native-button-multiselect";
import { supabase } from "@/lib/supabase";

import { Colors } from "@/constants/Colors";
import { addToCart } from "@/data/data";
import { CartItemProps, Product } from "@/types/types";

import { useWidth } from "@/context/WidthContext";

interface ProductModalProps {
  visible: boolean;
  onClose: () => void;
  colors: {
    color: string;
    image: string;
  }[];
  sizes: {
    size: string;
    dimension: string;
  }[];
  variant: {
    variant_id: string;
    product_color: {
      color: string;
      image: string;
    };
    product_size: {
      size: string;
      dimension: string;
    };
    product_quantity: number;
  }[];
  discount: number;
  discountPrice?: number;
  originalPrice: number;
  mode?: "cart" | "buy_now";
  product?: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  onClose,
  colors,
  sizes,
  variant,
  discount,
  discountPrice,
  originalPrice,
  mode = "cart",
  product,
}) => {
  const [cartImageDis, setCartImage] = useState<string>();
  const [cartStock, setCartStock] = useState<number>(0);

  const width = useWidth();

  const { cartItems, setCartItems, setSelectedPurchase } = useCart();

  const [isLoading, setIsLoading] = useState(false);

  const [quantity, setQuantity] = useState<number>(1);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedDimensions, setSelectedDimension] = useState<string | null>(null);

  const [selectVariant, setVariant] = useState<string | undefined>("");

  const [showLottie, setShowLottie] = useState<boolean>(false);

  const colorBtn = colors.map((color) => ({
    label: color.color,
    value: color.color,
  }));

  const sizeBtn = sizes.map((size) => ({
    label: size.size,
    value: size.size,
  }));

  const router = useRouter();

  useEffect(() => {
    if (selectedColor && selectedSize) {
      const selectedVariant = variant.find(
        (stock) => stock.product_color?.color === selectedColor && stock.product_size?.size === selectedSize
      );

      if (selectedVariant) {
        setCartStock(selectedVariant.product_quantity);
        setVariant(selectedVariant.variant_id);
      } else {
        setCartStock(0);
        setQuantity(1);
        setVariant("selected");
      }
    } else {
      setVariant("");
      setQuantity(1);
    }
  }, [selectedColor, selectedSize, variant]);

  const handleSizeSelected = (selectedValues: any) => {
    setSelectedSize(selectedValues);
    const selected = sizes.find((size) => size.size === selectedValues);
    setSelectedDimension(selected ? selected.dimension : null);
  };

  const handleColorSelected = (selectedValues: any) => {
    setSelectedColor(selectedValues);
    const selected = colors.find((color) => color.color === selectedValues);

    if (selected && selected.image) {
      setCartImage(selected.image);
    } else {
      setCartImage(undefined);
    }
  };

  const handleDisable = () => {
    return selectedSize && selectedColor && cartStock > 0 ? false : true;
  };

  const handleAction = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      Alert.alert("Not Logged In", "Please log in first to continue shopping!");
      router.push("/LoginScreen");
      return;
    }

    if (handleDisable()) return;

    if (!selectVariant || selectVariant === "selected") {
      Alert.alert("Selection Required", "Please select a valid color and size.");
      return;
    }

    if (mode === "buy_now") {
      // Instant 1-Click Purchase: populate selectedPurchase and route to CheckOutScreen
      const instantPurchaseItem: CartItemProps = {
        cart_id: `instant-${Date.now()}`,
        variant_id: selectVariant,
        user_id: userId,
        quantity: quantity,
        product_variant: {
          product_id: product?.product_id || "",
          products: {
            product_name: product?.product_name || "Product",
            product_price: originalPrice,
            product_discount: discount || 0,
            seller_id: product?.seller_id || "",
          },
          product_size: {
            id: selectedSize,
            size: selectedSize,
            dimension: selectedDimensions || "",
            product_id: product?.product_id || "",
          },
          product_color: {
            id: selectedColor,
            color: selectedColor,
            image: cartImageDis || colors[0]?.image || "",
            product_id: product?.product_id || "",
          },
          product_quantity: cartStock,
        },
      };

      setSelectedPurchase([instantPurchaseItem]);
      onClose();
      router.push("/CheckOutScreen");
      return;
    }

    // Standard Add to Cart
    setIsLoading(true);
    const data: CartItemProps | null = await addToCart(userId, selectVariant, quantity);
    setIsLoading(false);

    if (data) {
      setCartItems((prevCartItems) => {
        const existingItemIndex = prevCartItems.findIndex((item) => item.cart_id === data.cart_id);

        if (existingItemIndex !== -1) {
          const updatedCartItems = [...prevCartItems];
          updatedCartItems[existingItemIndex].quantity = data.quantity;
          return updatedCartItems;
        } else {
          return [data, ...prevCartItems];
        }
      });

      setShowLottie(true);
      setTimeout(() => {
        setShowLottie(false);
        onClose();
      }, 1800);
    } else {
      Alert.alert("Error", "Could not add item to cart. Please try again.");
    }
  };

  const handleQuantityDisable = (type: string) => {
    if (type === "increment") {
      return !(selectedSize && selectedColor && quantity < cartStock);
    } else if (type === "decrement") {
      return quantity <= 1;
    }
    return false;
  };

  const StockCount: React.FC<{ color: string; size: string }> = ({ color, size }) => {
    const stocks = variant.find((stock) => stock.product_color?.color === color && stock.product_size?.size === size);
    return (
      <Text style={{ color: stocks?.product_quantity ? Colors.subtitle : "#b91c1c", fontSize: 13, fontWeight: "500" }}>
        Stock: {stocks?.product_quantity ? `${stocks.product_quantity} available` : "Out of Stock"}
      </Text>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalView, { width: width }]}
            onPress={() => {}}>
            {/* Header Bar */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalModeTitle}>{mode === "buy_now" ? "Instant Buy" : "Select Option"}</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ width: "100%" }}>
              {/* Product Info Summary Row */}
              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                {cartImageDis ? (
                  <Image
                    source={{ uri: cartImageDis }}
                    style={styles.cartImage}
                  />
                ) : colors.length > 0 ? (
                  <Image
                    source={{ uri: colors[0].image }}
                    style={styles.cartImage}
                  />
                ) : null}

                <View style={styles.productSummaryCol}>
                  <View>
                    {discount && discountPrice ? (
                      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                        <Text style={styles.discountedPrice}>₱{discountPrice.toFixed(2)}</Text>
                        <Text style={styles.originalPrice}>₱{originalPrice.toFixed(2)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.productPrice}>₱{originalPrice.toFixed(2)}</Text>
                    )}
                  </View>

                  {selectedSize && selectedColor && (
                    <StockCount
                      color={selectedColor}
                      size={selectedSize}
                    />
                  )}

                  {/* Quantity Stepper */}
                  <View style={styles.quantityStepperWrap}>
                    <Text style={styles.quantityLabel}>Quantity</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={[styles.stepperBtn, handleQuantityDisable("decrement") && styles.buttonDisabled]}
                        disabled={handleQuantityDisable("decrement")}
                        onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValueText}>{selectVariant ? (cartStock > 0 ? quantity : 0) : 1}</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, handleQuantityDisable("increment") && styles.buttonDisabled]}
                        disabled={handleQuantityDisable("increment")}
                        onPress={() => setQuantity((q) => q + 1)}>
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Color Selector */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionTitle}>Colors</Text>
                <ButtonMultiselect
                  layout={ButtonLayout.GRID}
                  buttons={colorBtn}
                  selectedButtons={selectedColor}
                  onButtonSelected={handleColorSelected}
                  buttonStyle={{ padding: 8, margin: 4, borderRadius: 8, minWidth: 80 }}
                  textStyle={{ fontSize: 13 }}
                  containerStyle={{ paddingHorizontal: 0 }}
                  selectedColors={{ backgroundColor: Colors.primary, borderColor: Colors.primary, textColor: "#fff" }}
                />
              </View>

              {/* Size Selector */}
              <View style={styles.optionSection}>
                <Text style={styles.optionSectionTitle}>Available Sizes</Text>
                <ButtonMultiselect
                  layout={ButtonLayout.GRID}
                  buttons={sizeBtn}
                  selectedButtons={selectedSize}
                  onButtonSelected={handleSizeSelected}
                  buttonStyle={{ padding: 8, margin: 4, borderRadius: 8, minWidth: 80 }}
                  textStyle={{ fontSize: 13 }}
                  containerStyle={{ paddingHorizontal: 0 }}
                  selectedColors={{ backgroundColor: Colors.primary, borderColor: Colors.primary, textColor: "#fff" }}
                />
                {selectedDimensions && <Text style={styles.dimensionsText}>Dimensions: {selectedDimensions}</Text>}
              </View>

              {/* Confirm Action Button */}
              <View style={{ paddingTop: 16 }}>
                <TouchableOpacity
                  onPress={handleAction}
                  disabled={handleDisable() || isLoading}
                  style={[
                    styles.confirmActionBtn,
                    mode === "buy_now" ? styles.buyNowActionBtn : styles.addToCartActionBtn,
                    handleDisable() && styles.buttonDisabled,
                  ]}>
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                    />
                  ) : (
                    <Text style={styles.confirmActionBtnText}>
                      {handleDisable() ? "CHOOSE YOUR PREFERENCE" : mode === "buy_now" ? "BUY NOW" : "ADD TO CART"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>

      {/* Success Overlay */}
      {showLottie ? (
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <Image
              source={require("@/assets/loader/addedCart.gif")}
              style={{ width: 120, height: 120 }}
            />
            <Text style={styles.successText}>Added to Cart Successfully!</Text>
          </View>
        </View>
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalView: {
    width: "100%",
    alignSelf: "center",
    padding: 18,
    paddingTop: 10,
    backgroundColor: "white",
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 0.8,
    borderBottomColor: "#f0f0f0",
  },
  modalModeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.title,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    color: Colors.subtitle,
    fontWeight: "bold",
  },
  cartImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  productSummaryCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.title,
  },
  discountedPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.discount || "#b91c1c",
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.subtitle,
    textDecorationLine: "line-through",
  },
  quantityStepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  quantityLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f3f4f6",
  },
  stepperBtnText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  stepperValueText: {
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.title,
  },
  optionSection: {
    marginTop: 10,
  },
  optionSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.title,
    marginBottom: 6,
  },
  dimensionsText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  confirmActionBtn: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartActionBtn: {
    backgroundColor: Colors.primary,
  },
  buyNowActionBtn: {
    backgroundColor: "#A05D31",
  },
  confirmActionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
    opacity: 0.7,
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  successCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    elevation: 10,
  },
  successText: {
    color: Colors.title,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
});

export default ProductModal;
