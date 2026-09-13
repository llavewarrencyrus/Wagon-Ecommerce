import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
} from "react-native";

import { useRoute, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StarRatingDisplay } from "react-native-star-rating-widget";
import { Colors } from "@/constants/Colors";
import { ProductScreenRouteProp } from "@/types/types";
import { getProductById, getProducts } from "@/data/data";
import { Product } from "@/types/types";
import DummySearchBar from "@/components/DummySearch";
import Loading from "@/components/Loading";
import ProductList from "@/components/ProductList";
import ProductImage from "@/components/ProductScreen/ProductImage";
import ProductPreview from "@/components/ProductScreen/ProductPreview";
import ProductDescription from "@/components/ProductScreen/ProductDescription";
import ProductModal from "@/components/ProductScreen/AddToCart";
import { useCart } from "@/context/CartProvider";
import { Ionicons } from "@expo/vector-icons";
import { useWidth } from "@/context/WidthContext";

const deviceWidth = useWidth();

// Native-only imports — guarded with lazy requires to avoid web crashes
const ParallaxScrollView = Platform.OS !== "web" ? require("@/components/ParallaxScrollView").default : null;
const GalleryPreview = Platform.OS !== "web" ? require("react-native-gallery-preview").default : null;

function ProductScreen() {
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [colors, setColors] = useState<{ color: string; image: string }[]>([]);
  const [sizes, setSizes] = useState<{ size: string; dimension: string }[]>([]);

  const [priceNumber, setPriceNumber] = useState<number>(0);
  const [finalPrice, setFinalPrice] = useState<number>(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"cart" | "buy_now">("cart");
  const [imageVisible, setImageVisible] = useState(false);

  const [imageIndex, setImageIndex] = useState(0);
  const [prevImage, setPrevImage] = useState<{ uri: string }[]>([]);

  const { cartItems } = useCart();

  const scrollY = useRef(new Animated.Value(0)).current;

  const route = useRoute<ProductScreenRouteProp>();
  const { id } = route.params;

  const router = useRouter();
  const navigation = useNavigation();

  const fetchProduct = async (productId: string) => {
    const fetchedProduct = await getProductById(productId);
    if (fetchedProduct && fetchedProduct.length > 0) {
      setProduct(fetchedProduct[0]);
    }
  };

  const fetchProducts = async () => {
    const fetchedProducts = await getProducts();
    setProducts(fetchedProducts || []);
  };

  useEffect(() => {
    fetchProduct(id);
    fetchProducts();
  }, [id]);

  useEffect(() => {
    StatusBar.setBarStyle("dark-content", true);
  }, []);

  useEffect(() => {
    if (product && product.product_variant) {
      const uniqueColors = [
        ...new Map<string, string>(
          product.product_variant
            .filter((v: any) => v.product_color?.color)
            .map((variant: any) => [variant.product_color.color as string, variant.product_color.image as string])
        ).entries(),
      ].map(([color, image]) => ({ color, image }));

      setColors(uniqueColors);

      const uniqueSizes = [
        ...new Map<string, string>(
          product.product_variant
            .filter((v: any) => v.product_size?.size)
            .map((variant: any) => [variant.product_size.size as string, variant.product_size.dimension as string])
        ).entries(),
      ].map(([size, dimension]) => ({ size, dimension }));

      setSizes(uniqueSizes);
    }
  }, [product]);

  useEffect(() => {
    const headerBackgroundColor = scrollY.interpolate({
      inputRange: [120, 260],
      outputRange: ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"],
      extrapolate: "clamp",
    });
    const searchOpacity = scrollY.interpolate({
      inputRange: [120, 260],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
    const listener = scrollY.addListener(({ value }) => {
      const backgroundColor = value > 110 ? "flex" : "none";
      navigation.setOptions({
        headerTitle: () => (
          <Animated.View style={{ display: backgroundColor, width: deviceWidth * 0.65, opacity: searchOpacity }}>
            <DummySearchBar />
          </Animated.View>
        ),
        headerBackground: () => (
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: headerBackgroundColor,
            }}
          />
        ),
      });
    });
    return () => scrollY.removeListener(listener);
  }, [navigation, scrollY]);

  const handleOpenModal = (mode: "cart" | "buy_now") => {
    setModalMode(mode);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleImage = (index: number) => {
    const imgs = product?.product_image?.map((url) => ({ uri: url }));
    if (imgs && imgs.length > 0) {
      StatusBar.setBarStyle("light-content", true);
      setPrevImage(imgs);
      setImageIndex(index);
      setImageVisible(true);
    }
  };

  const handleImageClose = () => {
    setPrevImage([]);
    setImageIndex(0);
    setImageVisible(false);
    setTimeout(() => {
      StatusBar.setBarStyle("dark-content", true);
    }, 100);
  };

  // Shared content block used by both web and native renderers
  const productContent = product && (
    <View style={{ backgroundColor: "#f5f5f7", paddingBottom: 90 }}>
      <ProductPreview
        product={product}
        setProductPrice={setPriceNumber}
        setDiscountedPrice={setFinalPrice}
      />
      <ProductDescription
        colors={colors}
        sizes={sizes}
      />

      {/* Ratings & Reviews Section */}
      <View style={styles.reviewsCard}>
        <View style={styles.reviewsHeaderRow}>
          <Text style={styles.sectionHeading}>Ratings & Reviews</Text>
          <TouchableOpacity onPress={() => router.push("/UnderConstruction")}>
            <Text style={styles.viewAllReviewsText}>View All (304) {">"}</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Score & Breakdown Meter */}
        <View style={styles.ratingOverviewRow}>
          <View style={styles.scoreContainer}>
            <Text style={styles.mainScoreNumber}>{product.product_rating || "4.9"}</Text>
            <StarRatingDisplay
              rating={product.product_rating || 4.9}
              starSize={16}
              color={Colors.star}
              starStyle={{ width: 4, height: "100%" }}
            />
            <Text style={styles.totalRatingLabel}>304 Ratings</Text>
          </View>

          {/* Star Rating Progress Bars */}
          <View style={styles.progressBarsCol}>
            {[
              { star: "5", pct: "85%" },
              { star: "4", pct: "10%" },
              { star: "3", pct: "3%" },
              { star: "2", pct: "1%" },
              { star: "1", pct: "1%" },
            ].map((bar) => (
              <View
                key={bar.star}
                style={styles.progressBarRow}>
                <Text style={styles.starNumLabel}>{bar.star}★</Text>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: bar.pct as any }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Verified Buyer Reviews List */}
        <View style={styles.reviewListWrap}>
          {[
            {
              name: "Alex R.",
              date: "Sep 02, 2024",
              variant: "Washed Charcoal • Large (L)",
              comment:
                "The heavyweight fabric quality is exceptional. Boxy oversized drape sits perfectly and holds up great after multiple washes. Fast shipping too!",
            },
            {
              name: "Maria S.",
              date: "Aug 28, 2024",
              variant: "Vintage Bone • Medium (M)",
              comment:
                "Exceeded all my expectations! Texture is super premium and the color is gorgeous. 100% recommended!",
            },
          ].map((rev, idx) => (
            <View
              key={idx}
              style={[styles.reviewItemCard, idx > 0 && styles.reviewItemBorder]}>
              <View style={styles.reviewerHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{rev.name[0]}</Text>
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.reviewerName}>{rev.name}</Text>
                      <View style={styles.verifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color="#16a34a"
                        />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewDate}>{rev.date}</Text>
                  </View>
                </View>
                <StarRatingDisplay
                  rating={5}
                  starSize={12}
                  color={Colors.star}
                  starStyle={{ width: 0, height: "100%" }}
                />
              </View>
              <Text style={styles.purchasedVariantText}>Purchased: {rev.variant}</Text>
              <Text style={styles.reviewCommentText}>{rev.comment}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations / Related Products */}
      <View style={{ marginTop: 10 }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={styles.sectionHeading}>You Might Also Like</Text>
        </View>
        <ProductList products={products.filter((item) => item.product_id !== id)} />
      </View>
    </View>
  );

  const bottomBar = (
    <View style={styles.bottomBarContainer}>
      <TouchableOpacity
        style={styles.iconActionBtn}
        onPress={() => router.push("/Chat")}>
        <Ionicons
          name="chatbubbles-outline"
          size={20}
          color={Colors.primary}
        />
        <Text style={styles.iconActionText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconActionBtn}
        onPress={() => router.push("/Cart")}>
        <View>
          <Ionicons
            name="cart-outline"
            size={20}
            color={Colors.primary}
          />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.iconActionText}>Cart</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => handleOpenModal("cart")}>
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buyNowButton}
        onPress={() => handleOpenModal("buy_now")}>
        <Text style={styles.buyNowButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8f8f9" }}>
      {product && product.product_image ? (
        <>
          {Platform.OS === "web" ? (
            // Web: simple ScrollView with image strip at top (no native parallax/gallery)
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 90 }}>
              {/* Horizontal image strip */}
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ height: deviceWidth * 0.85, backgroundColor: "#e5e7eb" }}>
                {product.product_image.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={{ width: deviceWidth, height: deviceWidth * 0.85 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {productContent}
            </ScrollView>
          ) : (
            // Native: full parallax + gallery experience
            ParallaxScrollView && (
              <ParallaxScrollView
                headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
                headerImage={
                  <ProductImage
                    imageUris={product.product_image}
                    onImagePress={handleImage}
                  />
                }
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                  useNativeDriver: false,
                })}>
                {productContent}
              </ParallaxScrollView>
            )
          )}

          {bottomBar}

          <ProductModal
            visible={modalVisible}
            onClose={closeModal}
            colors={colors}
            sizes={sizes}
            variant={product.product_variant || []}
            discount={product.product_discount}
            discountPrice={finalPrice}
            originalPrice={priceNumber}
            mode={modalMode}
            product={product}
          />

          {/* GalleryPreview — native only */}
          {Platform.OS !== "web" && GalleryPreview && (
            <GalleryPreview
              images={prevImage}
              initialIndex={imageIndex}
              isVisible={imageVisible}
              onRequestClose={handleImageClose}
            />
          )}
        </>
      ) : (
        <Loading />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewsCard: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 8,
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  reviewsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "bold",
    color: Colors.title,
  },
  viewAllReviewsText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  ratingOverviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: "#f3f4f6",
  },
  mainScoreNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.title,
    lineHeight: 40,
  },
  totalRatingLabel: {
    fontSize: 12,
    color: Colors.subtitle,
    marginTop: 2,
  },
  progressBarsCol: {
    flex: 1,
    marginLeft: 16,
  },
  progressBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  starNumLabel: {
    fontSize: 11,
    color: "#666",
    width: 22,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.star || "#eab308",
    borderRadius: 3,
  },
  reviewListWrap: {
    marginTop: 8,
  },
  reviewItemCard: {
    paddingVertical: 12,
  },
  reviewItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  reviewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3ece7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.primary,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.title,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
  },
  verifiedText: {
    fontSize: 10,
    color: "#16a34a",
    marginLeft: 2,
    fontWeight: "500",
  },
  reviewDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 1,
  },
  purchasedVariantText: {
    fontSize: 12,
    color: Colors.subtitle,
    marginVertical: 4,
  },
  reviewCommentText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconActionBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  iconActionText: {
    fontSize: 11,
    color: Colors.title,
    marginTop: 2,
    fontWeight: "500",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: Colors.discount || "#b91c1c",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: "#F5EBE6",
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  addToCartButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  buyNowButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ProductScreen;
