import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useCart } from '@/context/CartProvider';

import ButtonMultiselect, { ButtonLayout } from 'react-native-button-multiselect';
import { supabase } from '@/lib/supabase';

import { Colors } from '@/constants/Colors';
import { addToCart } from '@/data/data';
import { CartItemProps, Product, Variant } from '@/types/types';
import { updateCart } from '@/data/data';

const { width } = Dimensions.get('window');

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

    const { cartItems, setCartItems } = useCart();

    const [isLoading, setIsLoading] = useState(false);

    const [product, setProduct] = useState<Variant[] | null | undefined>(variants);

    const [colors, setColors] = useState<{ color: string; image: string; }[]>([]);
    const [sizes, setSizes] = useState<{ size: string; dimension: string; }[]>([]);

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedDimensions, setSelectedDimension] = useState<string | null | undefined>('');

    const [selectVariant, setVariant] = useState<string | undefined>('')

    const [productPrice, setProductPrice] = useState<number>();
    const [discountedPrice, setDiscountedPrice] = useState<number | null>();

    const router = useRouter();

    const colorBtn = colors.map(color => ({
        label: color.color,
        value: color.color
    }));

    const sizeBtn = sizes.map(size => ({
        label: size.size,
        value: size.size
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
    }

    useEffect(() => {
        if (product) {
            const discountedPrice = calculateDiscountedPrice(price, discount);
            setProductPrice(price);
            setDiscountedPrice(discountedPrice);

            const uniqueColors = [
                ...new Map<string, string>(
                    product.map((variant: any) => [
                        variant.product_color.color as string,
                        variant.product_color.image as string,
                    ])
                ).entries(),
            ].map(([color, image]) => ({ color, image }));

            const uniqueSizes = [
                ...new Map<string, string>(
                    product.map((variant: any) => [
                        variant.product_size.size as string,
                        variant.product_size.dimension as string,
                    ])
                ).entries(),
            ].map(([size, dimension]) => ({ size, dimension }));

            setColors(uniqueColors);
            setSizes(uniqueSizes);
        }
    }, [product]);

    

    const handleSizeSelected = (selectedValues: any) => {
        setSelectedSize(selectedValues);
        const selected = sizes.find(size => size.size === selectedValues);
        setSelectedDimension(selected ? selected.dimension : null);
    };

    const handleColorSelected = (selectedValues: any) => {
        setSelectedColor(selectedValues);
        const selected = colors.find(color => color.color === selectedValues);

        if (selected && selected.image) {
            setCartImage(selected.image);
        } else {
            setCartImage(undefined);
        }
    };

    useEffect(() => {
        if (visible && variant) {
            handleSizeSelected(variant.product_variant.product_size.size || '');
            handleColorSelected(variant.product_variant.product_color.color || '');
            setCartImage(variant.product_variant.product_color.image || '');
            setSelectedDimension(variant.product_variant.product_size.dimension);
        }
    }, [colors, sizes]);

    const handleDisable = () => {
        return ((selectedSize && selectedColor) && cartStock != 0) ? false : true;
    }

    const handleUpdateCart = async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        if (!userId) {
            Alert.alert('Not logged in', 'Please log in first!');
            router.push('../LoginScreen');
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
                        prevCartItems.map((item) =>
                            item.cart_id === variant.cart_id ? updatedItem : item
                        )
                    );
                    Alert.alert('Success', 'Item updated in cart!');
                } else {
                    Alert.alert('Error', 'Could not update item in cart. Please try again.');
                }
            }
        }
    };

    const StockCount: React.FC<{ color: string, size: string }> = ({ color, size }) => {
        const stocks = product?.find(stock => stock.product_color.color === color && stock.product_size.size === size);

        return <Text style={{ color: Colors.secondary }}>Stock: {stocks?.product_quantity ? stocks.product_quantity : 'Out Of Stock'}</Text>;
    };

    const resetSelections = () => {
        setSelectedSize('');
        setSelectedColor('');
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
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose} accessible={true} accessibilityLabel="Close modal">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalView}
                        onPress={() => { }}
                    >
                        <TouchableOpacity style={styles.closeModal} onPress={handleClose}>
                            <Text style={{ fontSize: 25, color: Colors.secondary }}>X</Text>
                        </TouchableOpacity>

                        <View style={{ height: '100%', width: '100%' }}>
                            <View style={{ flexDirection: 'row' }}>
                                {cartImageDis ? (
                                    <Image source={{ uri: cartImageDis }} style={styles.cartImage} />
                                ) : (colors.length > 0 ? (
                                    <Image source={{ uri: colors[0].image }} style={styles.cartImage} />
                                ) : null)}
                                <View style={{ flexDirection: 'column', paddingHorizontal: 8, width: 'auto' }}>
                                    <View style={{ flexDirection: 'column', width: 'auto' }}>
                                        {discount && discountedPrice ? (
                                            <>
                                                <Text style={[styles.discountedPrice, { marginLeft: 0 }]}>₱{discountedPrice.toFixed(2)}</Text>
                                                <Text style={[styles.originalPrice, { marginLeft: 0 }]}>₱{productPrice?.toFixed(2)}</Text>
                                            </>
                                        ) : (
                                            <Text style={[styles.productPrice, { padding: 8, marginLeft: 0 }]}>₱{productPrice?.toFixed(2)}</Text>
                                        )}
                                    </View>
                                    {selectedSize && selectedColor && (
                                        <StockCount color={selectedColor} size={selectedSize} />
                                    )}
                                </View>
                            </View>
                            <View>
                                <View>
                                    <Text style={{ paddingVertical: 10, color: Colors.text }}>Color:</Text>
                                    <ButtonMultiselect
                                        layout={ButtonLayout.GRID}
                                        buttons={colorBtn}
                                        selectedButtons={selectedColor}
                                        onButtonSelected={handleColorSelected}
                                        buttonStyle={{ padding: 100, margin: 0 }}
                                        textStyle={{ fontSize: 14, padding: 0 }}
                                        containerStyle={{ padding: 0 }}
                                        selectedColors={{ backgroundColor: Colors.selectHighlight, borderColor: Colors.border, textColor: '#ffff' }}
                                    />
                                </View>
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                                        <Text style={{ color: Colors.text }}>Size:</Text>
                                        {selectedDimensions && (
                                            <Text style={styles.dimensionsText}>{selectedDimensions}</Text>
                                        )}
                                    </View>
                                    <ButtonMultiselect
                                        layout={ButtonLayout.GRID}
                                        buttons={sizeBtn}
                                        selectedButtons={selectedSize}
                                        onButtonSelected={handleSizeSelected}
                                        buttonStyle={{ padding: 100, margin: 0 }}
                                        textStyle={{ fontSize: 14, padding: 0 }}
                                        containerStyle={{ padding: 0 }}
                                        selectedColors={{ backgroundColor: Colors.selectHighlight, borderColor: Colors.border, textColor: '#ffff' }}
                                    />
                                </View>
                                <View>
                                    <TouchableOpacity
                                        onPress={handleUpdateCart}
                                        disabled={handleDisable()}

                                        style={[styles.closeButton,
                                        handleDisable() ? styles.buttonDisabled : null
                                        ]}
                                    >
                                        <Text style={styles.buttonText}>
                                            {handleDisable() ?
                                                'CHOOSE YOUR PREFERENCE' : 'UPDATE'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    productPrice: {
        fontSize: 25,
        fontWeight: 'bold',
        marginLeft: 'auto'
    },
    originalPrice: {
        fontSize: 15,
        textAlignVertical: 'bottom',
        color: Colors.secondary,
        textDecorationLine: 'line-through',
        marginLeft: 'auto'
    },
    discountedPrice: {
        fontSize: 25,
        fontWeight: 'bold',
        color: Colors.discount,
        marginLeft: 'auto',
        marginRight: 0
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
    addCartWrapper: {
        position: 'absolute',
        bottom: 0,
        width: width,
        backgroundColor: 'white',
        borderWidth: 0.2,
        borderColor: Colors.secondary,
        paddingVertical: 10
    },
    addCartBtn: {
        width: width * 0.7,
        marginBottom: 'auto',
        marginHorizontal: 'auto',
        borderWidth: 0,
        borderRadius: 24,
        paddingVertical: 10,
        backgroundColor: Colors.button
    },
    buttonDisabled: {
        backgroundColor: Colors.buttonDisabled
    }
});

export default UpdateModal;
