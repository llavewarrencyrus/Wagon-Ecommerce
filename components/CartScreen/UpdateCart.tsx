import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image } from "react-native";
import CustomAlertModal, { ModalButton } from "@/components/common/CustomAlertModal";
import { useRouter } from "expo-router";

import { useCart } from "@/context/CartProvider";

import ButtonMultiselect, { ButtonLayout } from "react-native-button-multiselect";
import { supabase } from "@/lib/supabase";

import { Colors } from "@/constants/Colors";
import { addToCart } from "@/data/data";
import { CartItemProps, Product, Variant } from "@/types/types";
import { updateCart } from "@/data/data";
import { useWidth } from "@/context/WidthContext";

interface UpdateModalProps {
  visible: boolean;
  onClose: () => void;
  variants?: Variant[] | null;
  variant?: CartItemProps;
  price?: number;
  discount?: number;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ visible, onClose, variants, variant, price, discount }) => {
  const [cartImageDis, setCartImage] = useState<string>();
  const [cartStock, setCartStock] = useState<number>(0);

  const width = useWidth();

  const { cartItems, setCartItems } = useCart();

  const [isLoading, setIsLoading] = useState(false);

  const [product, setProduct] = useState<Variant[] | null | undefined>(variants);

  const [colors, setColors] = useState<{ color: string; image: string }[]>([]);
  const [sizes, setSizes] = useState<{ size: string; dimension: string }[]>([]);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedDimensions, setSelectedDimension] = useState<string | null | undefined>("");

  const [selectVariant, setVariant] = useState<string | undefined>("");

  const [productPrice, setProductPrice] = useState<number>();
  const [discountedPrice, setDiscountedPrice] = useState<number | null>();
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });

  const router = useRouter();

  const colorBtn = colors.map((color) => ({
    label: color.color,
    value: color.color,
  }));

  const sizeBtn = sizes.map((size) => ({
    label: size.size,
    value: size.size,
  }));

  useEffect(() => {
    const selectedVariant = product?.find(
      (stock) => stock.product_color.color === selectedColor && stock.product_size.size === selectedSize
    );

    if (selectedVariant) {
      setCartStock(selectedVariant.product_quantity);
      setVariant(selectedVariant.variant_id);
    } else {
      setCartStock(0);
    }
  }, [selectedColor, selectedSize, variant]);

  const calculateDiscountedPrice = (price: number | undefined, discount: number | undefined): number | undefined => {
    if (!price || !discount) return price;
    return price * (1 - discount / 100);
  };

  useEffect(() => {
    if (product) {
      const discountedPrice = calculateDiscountedPrice(price, discount);
      setProductPrice(price);
      setDiscountedPrice(discountedPrice);

      const uniqueColors = [
        ...new Map<string, string>(
          product.map((variant: any) => [variant.product_color.color as string, variant.product_color.image as string])
        ).entries(),
      ].map(([color, image]) => ({ color, image }));

      const uniqueSizes = [
        ...new Map<string, string>(
          product.map((variant: any) => [variant.product_size.size as string, variant.product_size.dimension as string])
        ).entries(),
      ].map(([size, dimension]) => ({ size, dimension }));

      setColors(uniqueColors);
      setSizes(uniqueSizes);
    }
  }, [product]);

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

  useEffect(() => {
    if (visible && variant) {
      handleSizeSelected(variant.product_variant.product_size.size || "");
      handleColorSelected(variant.product_variant.product_color.color || "");
      setCartImage(variant.product_variant.product_color.image || "");
      setSelectedDimension(variant.product_variant.product_size.dimension);
    }
  }, [colors, sizes]);

  const handleDisable = () => {
    return selectedSize && selectedColor && cartStock != 0 ? false : true;
  };

  const handleUpdateCart = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      setAlertModal({
        visible: true,
        title: "Not logged in",
        message: "Please log in first!",
        buttons: [
          {
            text: "OK",
            onPress: () => router.push("/LoginScreen"),
          },
        ],
      });
      return;
    }
    if (handleDisable()) return;

    if (selectVariant) {
      setIsLoading(true);

      // Update the cart item
      if (variant) {
        const updatedItem = await updateCart(userId, selectVariant, variant.cart_id);
        setIsLoading(false);

        if (updatedItem) {
          // Update the cart items state by replacing the item with the same variant_id
          setCartItems((prevCartItems) =>
            prevCartItems.map((item) => (item.cart_id === variant.cart_id ? updatedItem : item))
          );
          setAlertModal({
            visible: true,
            title: "Success",
            message: "Item updated in cart!",
          });
        } else {
          setAlertModal({
            visible: true,
            title: "Error",
            message: "Could not update item in cart. Please try again.",
          });
        }
      }
    }
  };

  const StockCount: React.FC<{ color: string; size: string }> = ({ color, size }) => {
    const stocks = product?.find((stock) => stock.product_color.color === color && stock.product_size.size === size);

    return (
      <Text style={{ color: Colors.secondary }}>
        Stock: {stocks?.product_quantity ? stocks.product_quantity : "Out Of Stock"}
      </Text>
    );
  };

  const resetSelections = () => {
    setSelectedSize("");
    setSelectedColor("");
    setSelectedDimension(null);
    setCartImage(undefined);
    setProduct(undefined);
    setColors([]);
    setSizes([]);
  };

  const handleClose = () => {
    resetSelections();
    onClose();
  };

  return (
    <>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback
        onPress={handleClose}
        accessible={true}
        accessibilityLabel="Close modal">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalView, { width: width }]}
            onPress={() => {}}>
            <View
              style={{
                flexDirection: "row",
                width: "95%",
                paddingBottom: 5,
                marginBottom: 10,
                borderBottomWidth: 0.8,
                borderColor: "#d0d0d0",
              }}>
              <Text style={{ width: "90%" }}></Text>
              <TouchableOpacity
                style={styles.closeModal}
                onPress={onClose}>
                <Text style={{ fontSize: 25, color: Colors.secondary, textAlign: "center" }}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: "100%", width: "100%" }}>
              <View style={{ flexDirection: "row" }}>
                {cartImageDis ? (
                  <Image
                    source={{ uri: cartImageDis }}
                    style={[styles.cartImage, { width: width / 3, height: ((width / 3) * 4) / 3 }]}
                  />
                ) : colors.length > 0 ? (
                  <Image
                    source={{ uri: colors[0].image }}
                    style={[styles.cartImage, { width: width / 3, height: ((width / 3) * 4) / 3 }]}
                  />
                ) : null}
                <View style={{ flexDirection: "column", paddingHorizontal: 8, width: "auto" }}>
                  <View style={{ flexDirection: "column", width: "auto" }}>
                    {discount && discountedPrice ? (
                      <>
                        <Text style={[styles.discountedPrice, { marginLeft: 0 }]}>₱{discountedPrice.toFixed(2)}</Text>
                        <Text style={[styles.originalPrice, { marginLeft: 0 }]}>₱{productPrice?.toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={[styles.productPrice, { padding: 8, marginLeft: 0 }]}>
                        ₱{productPrice?.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {selectedSize && selectedColor && (
                    <StockCount
                      color={selectedColor}
                      size={selectedSize}
                    />
                  )}
                </View>
              </View>
              <View>
                <View>
                  <Text style={{ paddingVertical: 10, color: Colors.text, fontSize: 20 }}>
                    Color{colors.length > 1 ? "s" : ""}
                  </Text>
                  <ButtonMultiselect
                    layout={ButtonLayout.GRID}
                    buttons={colorBtn}
                    selectedButtons={selectedColor}
                    onButtonSelected={handleColorSelected}
                    buttonStyle={{ padding: 100, margin: 0 }}
                    textStyle={{ fontSize: 14, padding: 0 }}
                    containerStyle={{ paddingHorizontal: 20 }}
                    selectedColors={{
                      backgroundColor: Colors.selectHighlight,
                      borderColor: Colors.border,
                      textColor: "#ffff",
                    }}
                  />
                </View>
                <View>
                  <View style={{ flexDirection: "column", paddingVertical: 10 }}>
                    <Text style={{ fontSize: 20, color: Colors.text }}>
                      Available Size{sizes.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={{ margin: "auto" }}>
                    <ButtonMultiselect
                      layout={ButtonLayout.GRID}
                      buttons={sizeBtn}
                      selectedButtons={selectedSize}
                      onButtonSelected={handleSizeSelected}
                      buttonStyle={{ padding: 100, margin: 0, borderRadius: 16, width: "30%" }}
                      textStyle={{ fontSize: 14, padding: 0 }}
                      containerStyle={{ width: "70%", padding: 0 }}
                      selectedColors={{
                        backgroundColor: Colors.selectHighlight,
                        borderColor: Colors.border,
                        textColor: "#ffff",
                      }}
                    />
                  </View>
                  <Text style={styles.dimensionsText}>{selectedDimensions && selectedDimensions}</Text>
                </View>
                <View style={{ paddingTop: 20 }}>
                  <TouchableOpacity
                    onPress={handleUpdateCart}
                    disabled={handleDisable()}
                    style={[styles.closeButton, handleDisable() ? styles.buttonDisabled : null]}>
                    <Text style={styles.buttonText}>{handleDisable() ? "CHOOSE YOUR PREFERENCE" : "UPDATE"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    <CustomAlertModal
      visible={alertModal.visible}
      title={alertModal.title}
      message={alertModal.message}
      buttons={alertModal.buttons}
      onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
    />
    </>
  );
};

const styles = StyleSheet.create({
  productPrice: {
    fontSize: 25,
    fontWeight: "bold",
    marginLeft: "auto",
  },
  originalPrice: {
    fontSize: 15,
    textAlignVertical: "bottom",
    color: Colors.secondary,
    textDecorationLine: "line-through",
    marginLeft: "auto",
  },
  discountedPrice: {
    fontSize: 25,
    fontWeight: "bold",
    color: Colors.discount,
    marginLeft: "auto",
    marginRight: 0,
  },
  dimensionsText: {
    color: Colors.primary,
    textAlign: "center",
    paddingTop: 10,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalView: {
    position: "absolute",
    bottom: 0,
    padding: 15,
    paddingTop: 5,
    backgroundColor: "white",
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
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
    borderRadius: 20,
  },
  buttonText: {
    color: "white",
    margin: "auto",
    fontWeight: "bold",
  },
  closeModal: {
    width: "10%",
  },
  cartImage: {
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
  },
  quantityBtn: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: Colors.button,
  },
});

export default UpdateModal;
