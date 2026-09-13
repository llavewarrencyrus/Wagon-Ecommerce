import React, { useState, useEffect } from "react";
import { View, Image, Dimensions } from "react-native";

import ProductList from "@/components/ProductList";
import { getProducts } from "@/data/data";

import { Product } from "@/types/types";
import { useWidth } from "@/context/WidthContext";

function TopSales() {
  const [newProducts, setNewProducts] = useState<Product[]>([]);

  const width = useWidth();

  const fetchResults = async () => {
    const fetchedProducts = await getProducts({ sortBy: "topSales" });
    setNewProducts(fetchedProducts);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require("@/assets/images/sales.png")}
        style={{ width: width, height: width * (3 / 4), resizeMode: "cover" }}
      />
      <View style={{ flex: 1, marginTop: -45 }}>
        <ProductList products={newProducts} />
      </View>
    </View>
  );
}
export default TopSales;
