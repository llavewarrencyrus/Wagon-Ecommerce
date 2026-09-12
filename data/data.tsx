import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { AddressProps, CartItemProps, Product, Variant, OrderStatus, StoreProfile, SellerOrder } from "@/types/types";

export const getProducts = async (
  filters: {
    sortBy?: "latest" | "topSales" | "priceAsc" | "priceDesc" | "relevance" | " ";
    category?: string;
    size?: string;
    color?: string;
    material?: string;
    searchTerm?: string;
  } = {},
  limit: number = 20,
  offset: number = 0
) => {
  let query = supabase.from("products").select(`
      *,
      product_variant (
        product_color ( color ),
        product_size ( size ),
        product_quantity
      )
    `);

  if (filters.category && filters.category.trim()) {
    query = query.contains("product_category", [filters.category.trim()]);
  }

  if (filters.size && filters.size.trim()) {
    query = query.eq("product_variant.product_size.size", filters.size.trim());
  }

  if (filters.color && filters.color.trim()) {
    query = query.eq("product_variant.product_color.color", filters.color.trim());
  }

  if (filters.material && filters.material.trim()) {
    query = query.eq("product_material", filters.material.trim());
  }

  if (filters.searchTerm && filters.searchTerm.trim()) {
    const cleanSearch = filters.searchTerm.trim().replace(/[%_'"`,()]/g, ' ').trim();
    if (cleanSearch) {
      query = query.or(`product_name.ilike.%${cleanSearch}%,product_description.ilike.%${cleanSearch}%`);
    }
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "latest":
        query = query.order("created_at", { ascending: false });
        break;
      case "topSales":
        query = query.order("sales_count", { ascending: false });
        break;
      case "relevance":
      default:
        break;
    }
  }

  query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error.message);
    return [];
  }

  if (filters.sortBy === "priceAsc" || filters.sortBy === "priceDesc") {
    const productsWithFinalPrice = data?.map((product) => ({
      ...product,
      final_Price: product.product_price * (1 - (product.product_discount || 0) / 100),
    }));

    switch (filters.sortBy) {
      case "priceAsc":
        productsWithFinalPrice.sort((a, b) => a.final_Price - b.final_Price);
        break;
      case "priceDesc":
        productsWithFinalPrice.sort((a, b) => b.final_Price - a.final_Price);
        break;
    }

    return productsWithFinalPrice || [];
  }

  return data || [];
};

export const getProductById = async (productId: string | number) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_variant (
        variant_id,
        product_quantity,
        product_color ( color, image ),
        product_size ( size, dimension )
      )`
    )
    .eq("product_id", productId);

  if (error) {
    console.error("Error fetching product:", error.message);
    return null;
  }
  // console.log('Fetched Products:', JSON.stringify(data, null, 2));

  return data;
};

export const getCategoryList = async (id: number | null) => {
  const query = supabase.from("category").select("*");

  const { data, error } = id === null ? await query.is("parent_id", null) : await query.contains("parent_id", [id]);

  if (error) {
    console.error("Error fetching product:", error.message);
    return null;
  }

  return data || [];
};

export const getVariant = async (productId: string): Promise<Variant[] | null> => {
  const { data, error } = await supabase
    .from("product_variant")
    .select("*,product_color ( color, image ),product_size ( size, dimension )")
    .eq("product_id", productId);

  if (error) {
    console.error("Error fetching variant items:", error.message);
    return null;
  }
  return data as Variant[] | null;
};

export const getCartItems = async (userId: string) => {
  const { data, error } = await supabase
    .from("cart")
    .select(
      "*, product_variant(product_id, products(product_name, product_price, product_discount), product_size(*), product_color(*), product_quantity)"
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching cart items:", error.message);
    return [];
  }
  // console.log('Fetched Products:', JSON.stringify(data, null, 2));
  return data || [];
};

const getCartItem = async (userId: string, variantId: string): Promise<CartItemProps | null> => {
  const { data, error } = await supabase
    .from("cart")
    .select(
      "*, product_variant(product_id, products(product_name, product_price, product_discount), product_size(*), product_color(*), product_quantity)"
    )
    .eq("variant_id", variantId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }
  return data as CartItemProps | null;
};

export const addToCart = async (userId: string, variantId: string, quantity: number): Promise<CartItemProps | null> => {
  const exist = await getCartItem(userId, variantId);
  if (exist) {
    const update = async () => await updateQuantity(exist.cart_id, exist.quantity + quantity);
    update();
  } else {
    const { data, error } = await supabase
      .from("cart")
      .insert([{ user_id: userId, variant_id: variantId, quantity: quantity }]);

    if (error) {
      console.error("Error adding item to cart:", error.message);
      return null;
    }
  }
  const item = await getCartItem(userId, variantId);

  return item;
};

export const updateQuantity = async (cartItemId: string, quantity: number) => {
  const { data, error } = await supabase.from("cart").update({ quantity: quantity }).eq("cart_id", cartItemId);

  if (error) {
    console.error("Error updating item quantity:", error.message);
    return null;
  }
  return data;
};

export const removeFromCart = async (cartItemId: string) => {
  const { data, error } = await supabase.from("cart").delete().eq("cart_id", cartItemId);

  if (error) {
    console.error("Error removing item from cart:", error.message);
    return null;
  }
  return data;
};

export const updateCart = async (userId: string, variantId: string, cartId: string): Promise<CartItemProps | null> => {
  const { data: updatedItems, error: updateError } = await supabase
    .from("cart")
    .update({ variant_id: variantId })
    .eq("user_id", userId)
    .eq("cart_id", cartId)
    .select(
      "*, product_variant(product_id, products(product_name, product_price, product_discount), product_size(*), product_color(*), product_quantity)"
    );

  if (updateError) {
    console.error("Error updating item in cart:", updateError.message);
    return null;
  }
  return updatedItems && updatedItems.length > 0 ? (updatedItems[0] as CartItemProps | null) : null;
};

export const getAddresses = async (userId: string | undefined) => {
  const { data, error } = await supabase.from("addresses").select("*").eq("user_id", userId);

  if (error) {
    console.error("Error fetching addresses:", error.message);
    return [];
  }

  return data;
};

export const getAddress = async (addressId: string) => {
  const { data, error } = await supabase.from("addresses").select("*").eq("id", addressId).single();

  if (error) {
    console.error("Error fetching address:", error.message);
    return null;
  }
  return data;
};

export const udpateAddress = async (address: AddressProps, addressId: string) => {
  const { data, error } = await supabase.from("addresses").update(address).eq("id", addressId).select();

  if (error) {
    console.error("Error updating address:", error.message);
    return null;
  }
  return data;
};

export const getSellerProducts = async (sellerId: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_variant (
        variant_id,
        product_quantity,
        product_color ( id, color, image ),
        product_size ( id, size, dimension )
      )
    `
    )
    .or(`seller_id.eq.${sellerId},seller_id.is.null`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching seller products:", error.message);
    return [];
  }
  return data || [];
};

export const deleteProduct = async (productId: string) => {
  const { error } = await supabase.from("products").delete().eq("product_id", productId);

  if (error) {
    console.error("Error deleting product:", error.message);
    throw new Error(error.message);
  }
  return true;
};

export const getSellerOrders = async (sellerId: string, status?: string) => {
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      addresses (*),
      users ( id, username, email, profile_picture ),
      product_variant (
        variant_id,
        product_id,
        product_quantity,
        products ( product_id, product_name, product_price, product_discount, product_image ),
        product_color ( id, color, image ),
        product_size ( id, size, dimension )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (sellerId) {
    query = query.or(`seller_id.eq.${sellerId},seller_id.is.null`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching seller orders:", error.message);
    return [];
  }
  return data || [];
};

export const getBuyerOrders = async (userId: string, status?: string) => {
  let query = supabase
    .from("orders")
    .select(
      `
      *,
      addresses (*),
      product_variant (
        variant_id,
        product_id,
        product_quantity,
        products ( product_id, product_name, product_price, product_discount, product_image ),
        product_color ( id, color, image ),
        product_size ( id, size, dimension )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching buyer orders:", error.message);
    return [];
  }
  return data || [];
};

export const cancelBuyerOrder = async (orderId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select();

  if (error) {
    console.error("Error cancelling order:", error.message);
    throw new Error(error.message);
  }
  return data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string,
  courier?: string,
  notes?: string
) => {
  const updatePayload: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber;
  if (courier !== undefined) updatePayload.courier = courier;
  if (notes !== undefined) updatePayload.notes = notes;

  const { data, error } = await supabase.from("orders").update(updatePayload).eq("id", orderId).select();

  if (error) {
    console.error("Error updating order status:", error.message);
    throw new Error(error.message);
  }
  return data;
};

export const getStoreProfile = async (userId: string): Promise<StoreProfile | null> => {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching store profile:", error.message);
    return null;
  }
  return data as StoreProfile;
};

export const updateStoreProfile = async (userId: string, storeData: Partial<StoreProfile>) => {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...storeData,
      is_seller: true,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating store profile:", error.message);
    throw new Error(error.message);
  }
  return data;
};

export const getSellerMetrics = async (sellerId: string) => {
  try {
    const orders = await getSellerOrders(sellerId);
    const products = await getSellerProducts(sellerId);

    let totalRevenue = 0;
    let todayRevenue = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let lowStockCount = 0;

    const todayStr = new Date().toISOString().split("T")[0];

    orders.forEach((order: any) => {
      const prod = order.product_variant?.products;
      const price = prod ? prod.product_price * (1 - (prod.product_discount || 0) / 100) : 0;

      if (order.status !== "cancelled") {
        totalRevenue += price;
        if (order.created_at && order.created_at.startsWith(todayStr)) {
          todayRevenue += price;
        }
      }

      if (order.status === "pending") pendingCount++;
      else if (order.status === "processing") processingCount++;
      else if (order.status === "shipped") shippedCount++;
      else if (order.status === "delivered") deliveredCount++;
    });

    products.forEach((prod: any) => {
      let totalProdStock = 0;
      if (prod.product_variant && Array.isArray(prod.product_variant)) {
        prod.product_variant.forEach((v: any) => {
          totalProdStock += v.product_quantity || 0;
        });
      }
      if (totalProdStock < 5) {
        lowStockCount++;
      }
    });

    return {
      totalRevenue,
      todayRevenue,
      totalOrders: orders.length,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      totalProducts: products.length,
      lowStockCount,
      recentOrders: orders.slice(0, 5),
    };
  } catch (err) {
    console.error("Error computing seller metrics:", err);
    return null;
  }
};
