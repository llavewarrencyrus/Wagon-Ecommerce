import React, { ReactNode } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

//Interface
export interface ProductWrapperProps {
  children: ReactNode;
}

export interface Variant {
  variant_id: string
  product_color: {
    color: string;
    image: string;
  }
  product_size: {
    size: string;
    dimension: string;
  }
  product_quantity: number;
}

export interface Product {
  product_id: string;
  seller_id?: string;
  product_name: string;
  product_description: string;
  product_image: Array<string>;
  product_price: number;
  product_discount: number;
  product_rating: number;
  sales_count: number;
  product_material: Array<string>;
  product_category?: Array<string>;
  product_variant: Variant[];
}

export interface StoreProfile {
  id: string;
  username: string;
  email: string;
  profile_picture?: string;
  is_seller: boolean;
  store_name?: string;
  store_description?: string;
  store_logo?: string;
  store_banner?: string;
  pickup_address?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type BuyerOrder = SellerOrder;

export interface SellerOrder {
  id: string;
  user_id: string;
  seller_id?: string;
  variant_id: string;
  address_id?: string;
  status: OrderStatus;
  tracking_number?: string;
  courier?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  addresses?: AddressProps;
  users?: {
    id: string;
    username: string;
    email: string;
    profile_picture?: string;
  };
  product_variant?: {
    variant_id: string;
    product_id: string;
    product_quantity: number;
    products: {
      product_id: string;
      product_name: string;
      product_price: number;
      product_discount: number;
      product_image: string[];
    };
    product_color?: {
      id: string;
      color: string;
      image?: string;
    };
    product_size?: {
      id: string;
      size: string;
      dimension?: string;
    };
  };
}

export interface ProductCardProps {
  imageUri: Array<string>;
  title: string;
  price: number;
  id: string;
  discount?: number;
  rating: number;
}

export interface ProductListProps {
  products: Product[];
  header?: React.ReactNode | null;
  onScroll?: ((event: any) => void);
  scroll?: boolean;
}
export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
};
export interface DummySearch {
  value?: string;
};

export interface Step1InsertProductProps {
  setProductData: (data: {
    productName: string;
    productPrice: string;
    productDescription: string;
    productDiscount: string;
    productRating: string;
    salesCount: string;
    productImage: string;
  }) => void;
}

export interface ProductPreviewProps {
  setProductPrice: (price: number) => void;
  setDiscountedPrice: (price: number) => void;
  product: Product;
}

export interface CartItemProps {
  cart_id: string;
  variant_id: string;
  user_id: string;
  product_variant: {
    product_id: string;
    products: {
      product_name: string;
      product_price: number;
      product_discount: number;
    };
    product_size: {
      id: string;
      size: string;
      dimension: string;
      product_id: string;
    };
    product_color: {
      id: string;
      color: string;
      image: string;
      product_id: string;
    };
    product_quantity: number;
  };
  quantity: number;
}

export interface AddressProps {
  id?: string;
  user_id?: string;
  title?: string;
  name:string;
  phone:string;
  house_number_street: string;
  barangay: string;
  city_municipality: string;
  province: string;
  postal_code: string;
  prefer: boolean;
}

//Types
export type RootStackParamList = {
  Home: undefined;
  Product: { id: string; keyword?: string; category?: string };
  ProductList: { products: Array<Product> };
  SellerMessages: undefined;
  SellerChat: { senderId: string; initialMessage?: string; productId?: string };
  SellerOrders: undefined;
  SellerProducts: undefined;
  AddProduct: undefined;
  UpdateProduct: { productId: string };
  EditStoreScreen: undefined;
  Search: { value?: string };
  Refresh: { refresh?: boolean };
  Address: { id?: string };
  CheckOut: { item: CartItemProps[] };
  OrdersScreen: { initialStatus?: OrderStatus | 'all' } | undefined;
};

export type NavigationProp = StackNavigationProp<RootStackParamList>;

export type SearchScreenProp = RouteProp<RootStackParamList, 'Search'>;

export type RefreshScreenProp = RouteProp<RootStackParamList, 'Refresh'>;

export type ProductScreenRouteProp = RouteProp<RootStackParamList, 'Product'>;

export type AddressScreenRouteProp = RouteProp<RootStackParamList, 'Address'>;

export type CheckOutScreenRouteProp = RouteProp<RootStackParamList, 'CheckOut'>;

export type UpdateProductRouteProp = RouteProp<RootStackParamList, 'UpdateProduct'>;

export type SellerMessagesNavigationProp = StackNavigationProp<RootStackParamList, 'SellerMessages'>;