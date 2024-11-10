import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { CartItemProps } from '@/types/types';

export const getProducts = async (
  filters: {
    sortBy?: 'latest' | 'topSales' | 'priceAsc' | 'priceDesc' | 'relevance' | ' ';
    category?: string;
    size?: string;
    color?: string;
    material?: string;
    searchTerm?: string;
  } = {},
  limit: number = 15,
  offset: number = 0
) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      product_variant (
        product_color ( color ),
        product_size ( size ),
        product_quantity
      )
    `)



  if (filters.category) {
    query = query.contains('product_category', [filters.category])
      .contains('product_category', [filters.searchTerm]);
  }

  if (filters.size) {
    query = query.eq('product_variant.product_size.size', filters.size);
  }


  if (filters.color) {
    query = query.eq('product_variant.product_color.color', filters.color);
  }


  if (filters.material) {
    query = query.eq('product_material', filters.material);
  }

  if (filters.searchTerm && !filters.category) {
    query = query.or(`product_name.ilike.%${filters.searchTerm}%`);
  }



  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'latest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'topSales':
        query = query.order('sales_count', { ascending: false });
        break;

      case 'relevance':
        query = query;
        break;
      default:
        break;
    }
  }

  query.range(offset, offset + limit - 1);

  const { data, error } = await query;


  if (error) {
    console.error('Error fetching products:', error.message);
    return [];
  }

  if (filters.sortBy === 'priceAsc' || filters.sortBy === 'priceDesc') {
    const productsWithFinalPrice = data?.map(product => ({
      ...product,
      final_Price: product.product_price * (1 - (product.product_discount / 100)),
    }));

    switch (filters.sortBy) {
      case 'priceAsc':
        productsWithFinalPrice.sort((a, b) => a.final_Price - b.final_Price);
        break;
      case 'priceDesc':
        productsWithFinalPrice.sort((a, b) => b.final_Price - a.final_Price);
        break;
    }

    return productsWithFinalPrice || [];
  }


  return data || [];
};

export const getProductById = async (productId: string | number) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variant (
        variant_id,
        product_quantity,
        product_color ( color, image ),
        product_size ( size, dimension )
      )`
    )
    .eq('product_id', productId)

  if (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }
  // console.log('Fetched Products:', JSON.stringify(data, null, 2));

  return data;
}

export const getCategoryList = async (id: number | null) => {
  const query = supabase.from('category').select('*');


  const { data, error } = id === null
    ? await query.is('parent_id', null)
    : await query.contains('parent_id', [id]);

  if (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }

  return data || [];
};

export const getCartItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('cart')
    .select('*, product_variant(product_id, products(product_name, product_price, product_discount), product_size(*), product_color(*), product_quantity)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching cart items:', error.message);
    return [];
  }
  // console.log('Fetched Products:', JSON.stringify(data, null, 2));
  return data || [];
};

const getCartItem = async (variantId: string): Promise<CartItemProps | null> => {
  const { data, error } = await supabase
    .from('cart')
    .select('*, product_variant(products(product_name, product_price, product_discount), product_size(*), product_color(*), product_quantity)')
    .eq('variant_id', variantId)
    .single();

  if (error) {
    console.error('Error fetching cart items:', error.message);
    return null;
  }
  return data as CartItemProps | null;
}

export const addToCart = async (userId: string, variantId: string): Promise<CartItemProps | null> => {
  const { data, error } = await supabase
    .from('cart')
    .insert([{ user_id: userId, variant_id: variantId }]);

  if (error) {
    console.error('Error adding item to cart:', error.message);
    return null;
  }

  const item = await getCartItem(variantId);

  return item;
};

export const updateQuantity = async (cartItemId: string, quantity: number) => {
  const { data, error } = await supabase
    .from('cart')
    .update({ quantity: quantity })
    .eq('variant_id', cartItemId);

  if (error) {
    console.error('Error updating item quantity:', error.message);
    return null;
  }
  return data;
};

export const removeFromCart = async (cartItemId: string) => {
  const { data, error } = await supabase
    .from('cart')
    .delete()
    .eq('variant_id', cartItemId);

  if (error) {
    console.error('Error removing item from cart:', error.message);
    return null;
  }
  return data;
};

export const updateCart = async (userId: string, variantId: string, cartId: string): Promise<CartItemProps | null> => {
  const { data: updatedItems, error: updateError } = await supabase
    .from('cart')
    .update({ variant_id: variantId })
    .eq('user_id', userId)
    .eq('cart_id', cartId)
    .select('*, product_variant(products(product_name, product_price, product_discount), product_size(*), product_color(*), product_quantity)');

  if (updateError) {
    console.error('Error updating item in cart:', updateError.message);
    return null;
  }
  return updatedItems && updatedItems.length > 0 ? updatedItems[0] as CartItemProps | null : null;
}