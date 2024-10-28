import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const getProducts = async (
  filters: {
    sortBy?: 'latest' | 'topSales' | 'priceAsc' | 'priceDesc' | 'relevance';
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
    query = query.or(`product_name.ilike.%${filters.searchTerm}%,product_name.ilike.%${filters.searchTerm}%`);
  }


  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'latest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'topSales':
        query = query.order('sales_count', { ascending: false });
        break;
      case 'priceAsc':
        query = query.order('product_price', { ascending: true });
        break;
      case 'priceDesc':
        query = query.order('product_price', { ascending: false });
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



  return data || [];
};

export const getProductById = async (productId: string | number) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_variant (
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

