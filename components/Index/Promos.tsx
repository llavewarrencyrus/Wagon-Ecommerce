import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  FlatList,
  ScrollView,
  View,
  Text,
  Pressable,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { Product } from "@/types/types";

const { width } = Dimensions.get("window");

interface PromosProps {
  colours: string[];
  banners: { uri: any; title?: string; subtitle?: string; target?: string }[];
  products: Product[];
  setHeaderColor?: (color: string) => void;
}

const CATEGORY_SHORTCUTS = [
  { id: "men", name: "Men's", icon: "shirt-outline", category: "Men's Apparel", color: "#4f46e5" },
  { id: "women", name: "Women's", icon: "woman-outline", category: "Women's Apparel", color: "#db2777" },
  { id: "footwear", name: "Shoes", icon: "footsteps-outline", category: "Footwear", color: "#ea580c" },
  { id: "electronics", name: "Tech", icon: "headset-outline", category: "Electronics", color: "#0284c7" },
  { id: "bags", name: "Bags", icon: "bag-handle-outline", category: "Bags & Accessories", color: "#7c3aed" },
  { id: "deals", name: "Top Sales", icon: "flame-outline", route: "/TopSales", color: "#e11d48" },
];

const BANNER_PROMOS = [
  {
    uri: require("@/assets/images/banner1.jpg"),
    title: "Autumn Urban Drop",
    badge: "NEW SEASON",
    route: "/NewArrival",
  },
  {
    uri: require("@/assets/images/banner2.jpg"),
    title: "Top Streetwear Styles",
    badge: "UP TO 30% OFF",
    route: "/TopSales",
  },
  {
    uri: require("@/assets/images/banner3.jpg"),
    title: "Everyday Essentials",
    badge: "EXCLUSIVE",
    route: "/Category",
  },
  {
    uri: require("@/assets/images/banner4.jpg"),
    title: "Trending Footwear",
    badge: "HOT PICKS",
    route: "/ResultScreen?category=Footwear",
  },
];

const Promos: React.FC<PromosProps> = ({ colours, products, setHeaderColor }) => {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);
  const bannerListRef = useRef<FlatList>(null);
  const isInteracting = useRef(false);

  // Sync header color whenever activeSlide changes
  useEffect(() => {
    if (setHeaderColor && colours && colours[activeSlide]) {
      setHeaderColor(colours[activeSlide]);
    }
  }, [activeSlide, colours, setHeaderColor]);

  // Auto-play banner carousel every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInteracting.current && BANNER_PROMOS.length > 0) {
        const nextSlide = (activeSlide + 1) % BANNER_PROMOS.length;
        bannerListRef.current?.scrollToIndex({
          index: nextSlide,
          animated: true,
        });
        setActiveSlide(nextSlide);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [activeSlide]);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(xOffset / width);
    if (slideIndex !== activeSlide && slideIndex >= 0 && slideIndex < BANNER_PROMOS.length) {
      setActiveSlide(slideIndex);
    }
  };

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getDiscountedPrice = (price: number, discount?: number) => {
    if (!discount || discount <= 0) return price;
    return price * (1 - discount / 100);
  };

  return (
    <View style={styles.container}>
      {/* 1. Hero Promotional Banner Slider */}
      <View style={[styles.bannerSection, { backgroundColor: colours?.[activeSlide] || colours?.[0] || "#8291b0" }]}>
        <FlatList
          ref={bannerListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={BANNER_PROMOS}
          keyExtractor={(_, index) => `banner-${index}`}
          onScroll={handleBannerScroll}
          scrollEventThrottle={16}
          onTouchStart={() => {
            isInteracting.current = true;
          }}
          onTouchEnd={() => {
            isInteracting.current = false;
          }}
          renderItem={({ item, index }) => (
            <Pressable
              key={`banner-${index}`}
              style={[styles.bannerCard, { backgroundColor: colours?.[index] || colours?.[0] }]}
              onPress={() => router.push(item.route as any)}>
              <Image
                source={item.uri}
                style={styles.bannerImage}
              />
              {/* Pagination Dots */}
              <View style={styles.dotsContainer}>
                {BANNER_PROMOS.map((_, idx) => (
                  <View
                    key={`dot-${idx}`}
                    style={[styles.dot, activeSlide === idx && styles.dotActive]}
                  />
                ))}
              </View>
            </Pressable>
          )}
        />
      </View>

      {/* 2. Quick Department Category Shortcuts Bar */}
      <View style={styles.shortcutsCard}>
        <View style={styles.shortcutsRow}>
          {CATEGORY_SHORTCUTS.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.shortcutItem}
              onPress={() => {
                if (cat.route) {
                  router.push(cat.route as any);
                } else {
                  router.push(`/ResultScreen?category=${encodeURIComponent(cat.category!)}`);
                }
              }}
              activeOpacity={0.7}>
              <View style={[styles.shortcutIconCircle, { backgroundColor: `${cat.color}15` }]}>
                <Ionicons
                  name={cat.icon as any}
                  size={22}
                  color={cat.color}
                />
              </View>
              <Text
                style={styles.shortcutLabel}
                numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. New Arrivals Horizontal Feed */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.badgeSparkle}>
              <Ionicons
                name="sparkles"
                size={14}
                color="#059669"
              />
            </View>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push("/NewArrival")}
            activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
            <Feather
              name="chevron-right"
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}>
          {products.slice(0, 6).map((item) => {
            const finalPrice = getDiscountedPrice(item.product_price, item.product_discount);
            const imageUri =
              item.product_image?.[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80";

            return (
              <Pressable
                key={`new-${item.product_id}`}
                style={styles.productPillCard}
                onPress={() => router.push(`/ProductScreen?id=${item.product_id}`)}>
                <View style={styles.imgWrap}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.productThumb}
                  />
                  {item.product_discount ? (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>-{item.product_discount}%</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={styles.productName}
                  numberOfLines={1}>
                  {item.product_name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.finalPriceText}>{formatPrice(finalPrice)}</Text>
                </View>
                {item.product_discount ? (
                  <Text style={styles.origPriceText}>{formatPrice(item.product_price)}</Text>
                ) : null}
              </Pressable>
            );
          })}

          <TouchableOpacity
            style={styles.moreEndCard}
            onPress={() => router.push("/NewArrival")}
            activeOpacity={0.7}>
            <View style={styles.moreIconCircle}>
              <Feather
                name="arrow-right"
                size={18}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.moreCardLabel}>View All</Text>
            <Text style={styles.moreCardSub}>New In</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. Top Sales Horizontal Feed */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.badgeSparkle, { backgroundColor: "#fee2e2" }]}>
              <Ionicons
                name="flame"
                size={15}
                color="#e11d48"
              />
            </View>
            <Text style={styles.sectionTitle}>Top Sales & Best Deals</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push("/TopSales")}
            activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
            <Feather
              name="chevron-right"
              size={14}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}>
          {products.slice(0, 6).map((item) => {
            const finalPrice = getDiscountedPrice(item.product_price, item.product_discount);
            const imageUri =
              item.product_image?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";

            return (
              <Pressable
                key={`top-${item.product_id}`}
                style={styles.productPillCard}
                onPress={() => router.push(`/ProductScreen?id=${item.product_id}`)}>
                <View style={styles.imgWrap}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.productThumb}
                  />
                  {item.product_discount ? (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>-{item.product_discount}%</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={styles.productName}
                  numberOfLines={1}>
                  {item.product_name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.finalPriceText}>{formatPrice(finalPrice)}</Text>
                </View>
                {item.product_discount ? (
                  <Text style={styles.origPriceText}>{formatPrice(item.product_price)}</Text>
                ) : null}
              </Pressable>
            );
          })}

          <TouchableOpacity
            style={styles.moreEndCard}
            onPress={() => router.push("/TopSales")}
            activeOpacity={0.7}>
            <View style={styles.moreIconCircle}>
              <Feather
                name="arrow-right"
                size={18}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.moreCardLabel}>View All</Text>
            <Text style={styles.moreCardSub}>Top Sales</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default Promos;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f8f9",
  },
  bannerSection: {
    position: "relative",
    backgroundColor: "#fff",
  },
  bannerCard: {
    width: width,
    height: width * 0.48,
    position: "relative",
  },
  bannerImage: {
    width: width,
    height: "100%",
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  bannerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  shortcutsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  shortcutsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  shortcutItem: {
    alignItems: "center",
    width: (width - 44) / 6,
  },
  shortcutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  sectionWrap: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  badgeSparkle: {
    backgroundColor: "#d1fae5",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.title,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginRight: 2,
  },
  hScrollContent: {
    paddingHorizontal: 12,
  },
  productPillCard: {
    width: 110,
    marginRight: 10,
  },
  imgWrap: {
    position: "relative",
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: 6,
  },
  productThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  discountBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  productName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  finalPriceText: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.primary,
  },
  origPriceText: {
    fontSize: 10,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  moreEndCard: {
    width: 90,
    height: 110,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ebdcd3",
    borderStyle: "dashed",
    backgroundColor: "#faf6f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  moreIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 1,
  },
  moreCardLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.primary,
  },
  moreCardSub: {
    fontSize: 10,
    color: Colors.subtitle,
  },
});
