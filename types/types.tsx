import React, { ReactNode } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

//Interface
export interface ProductWrapperProps {
  children: ReactNode;
}


export interface Product {
  product_id: string;
  product_name: string;
  product_description: string;
  product_image: Array<string>;
  product_price: number;
  product_discount: number;
  product_rating: number;
  sales_count: number;
  product_material: Array<string>;
  product_variant: {
    product_color: {
      color: string;
      image: string;
    }
    product_size: {
      size: string;
      dimension: string;
    }
    product_quantity: number;
  }[]
}

export interface ProductCardProps {
  imageUri: Array<string>;
  title: string;
  price: string;
  id: string;
  discount?: number;
  rating: number;
}

export interface ProductListProps {
  products: Product[] ;         
  header?: React.ReactNode | null;     
  onScroll?: ((event: any) => void);  
  scroll?: boolean;  
}
export interface Category  {
  id: number;
  name: string;
  parent_id: number | null;
};
export interface DummySearch  {
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

//Types
export type RootStackParamList = {
  Home: undefined;
  Product: { id: string; keyword: string; category: string };
  ProductList: {products: Array<Product>};
  SellerMessages: undefined;
  SellerChat: { senderId: string };
  Search: {value?: string}
};

export type NavigationProp = StackNavigationProp<RootStackParamList>;

export type SearchScreenProp = RouteProp<RootStackParamList, 'Search'>;

export type ProductScreenRouteProp = RouteProp<RootStackParamList, 'Product'>;

export type SellerMessagesNavigationProp = StackNavigationProp<RootStackParamList, 'SellerMessages'>;