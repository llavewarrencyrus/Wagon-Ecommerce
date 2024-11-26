import React, { useEffect, useState, Dispatch, SetStateAction } from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useCart } from '@/context/CartProvider';

import ButtonMultiselect, { ButtonLayout } from 'react-native-button-multiselect';
import { supabase } from '@/lib/supabase';

import { Colors } from '@/constants/Colors';
import { addToCart } from '@/data/data';
import { CartItemProps } from '@/types/types';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface ProductModalProps {
    visible: boolean;
    onClose: () => void;
    colors: {
        color: string,
        image: string
    }[]
    sizes: {
        size: string,
        dimension: string
    }[]
    variant: {
        variant_id: string
        product_color: {
            color: string;
            image: string;
        };
        product_size: {
            size: string;
            dimension: string;
        };
        product_quantity: number;
    }[]
    discount: number
    discountPrice?: number
    originalPrice: number
}

const ProductModal: React.FC<ProductModalProps> = ({ visible, onClose, colors, sizes, variant, discount, discountPrice, originalPrice }) => {
    const [cartImageDis, setCartImage] = useState<string>();
    const [cartStock, setCartStock] = useState<number>(0);

    const { cartItems, setCartItems } = useCart();

    const [isLoading, setIsLoading] = useState(false);

    const [quantity, setQuantity] = useState<number>(1);

    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedDimensions, setSelectedDimension] = useState<string | null>(null);

    const [selectVariant, setVariant] = useState<string | undefined>('');

    const [showLottie, setShowLottie] = useState<boolean>(false);

    const colorBtn = colors.map(color => ({
        label: color.color,
        value: color.color
    }));

    const sizeBtn = sizes.map(size => ({
        label: size.size,
        value: size.size
    }));

    const router = useRouter();

    useEffect(() => {
        if (selectedColor && selectedSize) {
            const selectedVariant = variant.find(
                (stock) => stock.product_color.color === selectedColor && stock.product_size.size === selectedSize
            );

            if (selectedVariant) {
                setCartStock(selectedVariant.product_quantity);
                setVariant(selectedVariant.variant_id);
            } else {
                setCartStock(0);
                setQuantity(1);
                setVariant('selected');
            }
        } else {
            setVariant('');
            setQuantity(1);
        }
    }, [selectedColor, selectedSize, variant]);

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

    const handleDisable = () => {
        return ((selectedSize && selectedColor) && cartStock != 0) ? false : true;
    }

    const handleAddToCart = async () => {
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
            const data: CartItemProps | null = await addToCart(userId, selectVariant, quantity);

            setIsLoading(false);

            if (data) {
                setCartItems((prevCartItems) => {
                    const existingItemIndex = prevCartItems.findIndex(
                        (item) => item.cart_id === data.cart_id
                    );

                    if (existingItemIndex !== -1) {

                        const updatedCartItems = [...prevCartItems];
                        updatedCartItems[existingItemIndex].quantity = data.quantity;
                        return updatedCartItems;
                    } else {
                        return [data, ...prevCartItems];
                    }
                }
                );

                setShowLottie(true);

                setTimeout(() => setShowLottie(false), 2300);
            } else {
                Alert.alert('Error', 'Could not add item to cart. Please try again.');
            }
        }
    };

    const handleQuantityDisable = (type: string) => {
        if (type === 'increment') {
            if (selectedSize && selectedColor && cartStock > 0) {
                return false;
            } else {
                return true;
            }
        } else if (type === 'decrement') {
            if (quantity === 1) {
                return true;
            } else {
                if (selectedSize && selectedColor) {
                    return false;
                } else {
                    return true;
                }
            }
        }
    }

    const StockCount: React.FC<{ color: string, size: string }> = ({ color, size }) => {
        const stocks = variant.find(stock => stock.product_color.color === color && stock.product_size.size === size);

        return <Text style={{ color: Colors.secondary }}>Available Stock: {stocks?.product_quantity ? stocks.product_quantity : 'Out Of Stock'}</Text>;
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalView}
                        onPress={() => { }}
                    >
                        <View style={{ flexDirection: 'row', width: '95%', paddingBottom: 5, marginBottom: 10, borderBottomWidth: 0.8, borderColor: '#d0d0d0' }}>
                            <Text style={{ width: '90%' }}></Text>
                            <TouchableOpacity style={styles.closeModal} onPress={onClose}>
                                <Text style={{ fontSize: 25, color: Colors.secondary, textAlign: 'center' }}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: '100%', width: '100%' }}>
                            <View>
                                <View style={{ flexDirection: 'row' }}>
                                    {cartImageDis ? (
                                        <Image source={{ uri: cartImageDis }} style={styles.cartImage} />
                                    ) : (colors.length > 0 ? (
                                        <Image source={{ uri: colors[0].image }} style={styles.cartImage} />
                                    ) : null)}
                                    <View style={{ flexDirection: 'column', paddingHorizontal: 8, flex: 1, justifyContent: 'space-between' }}>
                                        <View style={{ flexDirection: 'column', width: 'auto' }}>
                                            {discount && discountPrice ? (
                                                <>
                                                    <Text style={[styles.discountedPrice, { marginLeft: 0 }]}>₱{discountPrice.toFixed(2)}</Text>
                                                    <Text style={[styles.originalPrice, { marginLeft: 0 }]}>₱{originalPrice.toFixed(2)}</Text>
                                                </>
                                            ) : (
                                                <Text style={[styles.productPrice, { padding: 8, marginLeft: 0 }]}>₱{originalPrice.toFixed(2)}</Text>
                                            )}
                                        </View>
                                        <View style={{ marginHorizontal: 'auto' }}>
                                            {selectedSize && selectedColor && (
                                                <StockCount color={selectedColor} size={selectedSize} />
                                            )}
                                        </View>
                                        <View style={{ marginHorizontal: 'auto' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.quantityBtn,
                                                        { borderBottomLeftRadius: 16, borderTopLeftRadius: 16 },
                                                        handleQuantityDisable('decrement') ? styles.buttonDisabled : null
                                                    ]}
                                                    disabled={handleQuantityDisable('decrement')}
                                                    onPress={() => setQuantity(stock => stock - 1)}>
                                                    <Text style={{ color: '#fff' }}>-</Text>
                                                </TouchableOpacity>
                                                <Text style={{ textAlignVertical: 'center', paddingHorizontal: 15, backgroundColor: '#f0f0f0', color: Colors.text }}>
                                                    {selectVariant ? (
                                                        cartStock > 0 ? (
                                                            quantity
                                                        ) : (
                                                            'Out of Stock'
                                                        )
                                                    ) : (
                                                        'Choose'
                                                    )}
                                                </Text>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.quantityBtn,
                                                        { borderBottomRightRadius: 16, borderTopRightRadius: 16 },
                                                        handleQuantityDisable('increment') ? styles.buttonDisabled : null
                                                    ]}
                                                    disabled={handleQuantityDisable('increment')}
                                                    onPress={() => setQuantity(stock => stock + 1)}>
                                                    <Text style={{ color: '#fff' }}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View>
                                    <View>
                                        <Text style={{ paddingVertical: 10, color: Colors.text, fontSize: 20 }}>Color{colors.length > 1 ? 's' : ''}</Text>
                                        <ButtonMultiselect
                                            layout={ButtonLayout.GRID}
                                            buttons={colorBtn}
                                            selectedButtons={selectedColor}
                                            onButtonSelected={handleColorSelected}
                                            buttonStyle={{ padding: 100, margin: 0 }}
                                            textStyle={{ fontSize: 14, padding: 0 }}
                                            containerStyle={{ paddingHorizontal: 20 }}
                                            selectedColors={{ backgroundColor: Colors.selectHighlight, borderColor: Colors.border, textColor: '#ffff' }}
                                        />
                                    </View>
                                    <View>
                                        <View style={{ flexDirection: 'column', paddingVertical: 10 }}>
                                            <Text style={{ fontSize: 20, color: Colors.text }}>Available Size{sizes.length > 1 ? 's' : ''}</Text>


                                        </View>
                                        <View style={{ margin: 'auto' }}>
                                            <ButtonMultiselect
                                                layout={ButtonLayout.GRID}
                                                buttons={sizeBtn}
                                                selectedButtons={selectedSize}
                                                onButtonSelected={handleSizeSelected}
                                                buttonStyle={{ padding: 100, margin: 0, borderRadius: 16, width: '30%' }}
                                                textStyle={{ fontSize: 14, padding: 0 }}
                                                containerStyle={{ width: '70%', padding: 0 }}
                                                selectedColors={{ backgroundColor: Colors.selectHighlight, borderColor: Colors.border, textColor: '#ffff' }}
                                            />
                                        </View>
                                        <Text style={styles.dimensionsText}>
                                            {selectedDimensions && (selectedDimensions)}
                                        </Text>
                                    </View>
                                    <View style={{ paddingTop: 20 }}>
                                        <TouchableOpacity
                                            onPress={handleAddToCart}
                                            disabled={handleDisable()}

                                            style={[styles.closeButton,
                                            handleDisable() ? styles.buttonDisabled : null
                                            ]}
                                        >
                                            <Text style={styles.buttonText}>
                                                {handleDisable() ?
                                                    'CHOOSE YOUR PREFERENCE' : 'ADD TO CART'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
            {showLottie ? (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999,
                }}>
                    <Image
                        source={require('@/assets/loader/addedCart.gif')}
                        style={{ width: 150, height: 150, }}
                    />
                    <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 10 }}>
                        Added to cart successfully!
                    </Text>
                </View>
            ) : null}
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
        textAlign: 'center',
        paddingTop: 10
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
        padding: 15,
        paddingTop: 5,
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
        borderRadius: 20,
    },
    buttonText: {
        color: 'white',
        margin: 'auto',
        fontWeight: 'bold',
    },
    closeModal: {
        width: '10%',

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
    },
    quantityBtn: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        backgroundColor: Colors.button
    }
});

export default ProductModal;
