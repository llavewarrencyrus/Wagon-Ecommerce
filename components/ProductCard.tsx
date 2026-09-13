import React from "react";
import { View, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { ProductCardProps } from "@/types/types";
import { SCREEN_WIDTH as width } from "@/constants/Layout";

const calculateDiscountedPrice = (price: number, discount?: number): number => {
  if (!discount || discount <= 0) return price;
  return price * (1 - discount / 100);
};

const formatPrice = (price: number): string => {
  return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ imageUri, title, price, id, discount, rating }) => {
  const router = useRouter();

  const finalPrice = calculateDiscountedPrice(price, discount);
  const primaryImage =
    Array.isArray(imageUri) && imageUri.length > 0
      ? imageUri[0]
      : typeof imageUri === "string" && imageUri
        ? imageUri
        : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/ProductScreen?id=${id}`)}
      activeOpacity={0.88}>
      {/* Product Image Thumbnail */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: primaryImage }}
          style={styles.productImage}
        />
        {discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{discount}%</Text>
          </View>
        ) : null}
      </View>

      {/* Product Details */}
      <View style={styles.cardBody}>
        <Text
          style={styles.productTitle}
          numberOfLines={2}>
          {title}
        </Text>

        {/* Rating & Sales Row */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Ionicons
              name="star"
              size={11}
              color="#f59e0b"
              style={{ marginRight: 2 }}
            />
            <Text style={styles.ratingText}>{(rating || 4.8).toFixed(1)}</Text>
          </View>
        </View>

        {/* Price Row */}
        <View style={styles.priceContainer}>
          <Text style={styles.finalPrice}>{formatPrice(finalPrice)}</Text>
          {discount ? <Text style={styles.originalPrice}>{formatPrice(price)}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    width: "auto",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  imageWrap: {
    width: "100%",
    height: width * 0.44,
    backgroundColor: "#f3f4f6",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#e11d48",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardBody: {
    padding: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1f2937",
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 36,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#b45309",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
  },
  finalPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.primary,
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
});
