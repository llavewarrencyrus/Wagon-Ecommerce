import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { CartItemProps } from '@/types/types';

interface CartContextProps {
  cartItems: CartItemProps[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItemProps[]>>;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItemProps[]>([]);

  return (
    <CartContext.Provider value={{ cartItems, setCartItems }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
