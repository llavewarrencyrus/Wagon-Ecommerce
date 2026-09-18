// CartItem.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import CustomAlertModal, { ModalButton } from '@/components/common/CustomAlertModal';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { CartItemProps, Variant } from '@/types/types';
import { getVariant } from '@/data/data';

interface CartItem {
  item: CartItemProps;
  selectedItems: string[];
  toggleSelectItem: (id: string, price: number, discount: number, quantity: number) => void;
  incrementQuantity: (item: CartItemProps) => void;
  decrementQuantity: (item: CartItemProps) => void;
  handleRemoveItem: (id: string) => void;
  handleUpdateCart: (item: CartItemProps, variant: Variant[] | null | undefined) => void;
}

const CartItem: React.FC<CartItem> = ({
  item,
  selectedItems,
  toggleSelectItem,
  incrementQuantity,
  decrementQuantity,
  handleRemoveItem,
  handleUpdateCart,
}) => {
  const [variant, setVariant] = useState<Variant[] | null | undefined>();
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });
  useEffect(() => {
    if (item && item.product_variant && item.product_variant.product_id) {
      const fetchVariant = async () => {
        try {
          const fetchedProduct = await getVariant(item.product_variant.product_id);
          if (fetchedProduct) {
            setVariant(fetchedProduct);
          } else {
            setAlertModal({
              visible: true,
              title: 'Error',
              message: 'Product Not Found',
            });
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          setAlertModal({
            visible: true,
            title: 'Error',
            message: 'Could not fetch product. Please try again.',
          });
        }
      };
      fetchVariant();
    } else {
      console.error("Invalid product_id:", item.product_variant.product_id);
    }
  }, [item]);
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
  };

  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemWrapper}>
        <TouchableWithoutFeedback onPress={() => toggleSelectItem(item.cart_id, item.product_variant.products.product_price, item.product_variant.products.product_discount, item.quantity)}>
          <MaterialIcons
            name={selectedItems.includes(item.cart_id) ? 'check-box' : 'check-box-outline-blank'}
            size={20}
            color={selectedItems.includes(item.cart_id) ? Colors.button : Colors.icon}
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
                <TouchableOpacity style={[styles.quantityButton, { borderBottomLeftRadius: 4, borderTopLeftRadius: 4 }]} onPress={() => handleRemoveItem(item.cart_id)}>
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
              <TouchableOpacity onPress={() => handleUpdateCart(item, variant)}>
                <View style={{ flexDirection: 'row' }}>
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

      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        buttons={alertModal.buttons}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};



const styles = StyleSheet.create({
  cartItem: {
    marginTop: 8,
    paddingHorizontal: 18,
    backgroundColor: 'white',
  },
  cartItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth:1,
    borderStyle: 'dashed',
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
    backgroundColor: '#f0f0f0',
  },
  checkbox: {
    marginRight: 8,
  },
  cartVar: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    marginLeft: 5,
    borderRadius: 4,
  },
});

export default CartItem;