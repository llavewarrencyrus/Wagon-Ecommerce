import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, StatusBar } from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import MasonryList from "@react-native-seoul/masonry-list";
import ProductCard from "@/components/ProductCard";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { getProducts } from "@/data/data";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "@/types/types";
import NetworkIssue from "@/components/NetworkIssue";
import { useNetwork } from "@/components/NetworkContext";
import Promos from "@/components/Index/Promos";
import Loading from "@/components/Loading";
import { useWidth } from "@/context/WidthContext";

const colours = ["#8291b0", "#d59876", "#beada5", "#ff9c9c"];
const banners = [
  { uri: require("@/assets/images/banner1.jpg") },
  { uri: require("@/assets/images/banner2.jpg") },
  { uri: require("@/assets/images/banner3.jpg") },
  { uri: require("@/assets/images/banner4.jpg") },
];

export function HomeScreen() {
  const { isConnected, refreshNetworkStatus } = useNetwork();
  const navigation = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [headerColor, setHeaderColor] = useState(colours[0]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const [currentBarStyle, setCurrentBarStyle] = useState<"light-content" | "dark-content">("light-content");
  const [statusBarStyle, setStatusBarStyle] = useState<"light-content" | "dark-content">("light-content");

  const width = useWidth();

  const isFocused = useIsFocused();

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: headerColor,
      },
    });
  }, [headerColor, navigation]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const fetchedProducts = await getProducts();
    setProducts(fetchedProducts || []);
    setLoading(false);
  };

  useEffect(() => {
    setStatusBarStyle(isFocused ? currentBarStyle : "dark-content");
  }, [isFocused]);

  useEffect(() => {
    StatusBar.setBarStyle(statusBarStyle, true);
  }, [statusBarStyle]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const interpolatedColor = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [headerColor, "#fff"],
    extrapolate: "clamp",
  });

  const numColumns = width > 1024 ? 4 : width > 768 ? 3 : 2;

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: interpolatedColor,
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push("/Chat")}
          style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 15, borderRadius: 20 }}>
          <Ionicons
            name="chatbubbles-outline"
            size={24}
            color="black"
          />
        </TouchableOpacity>
      ),
    });
  }, [headerColor]);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      setStatusBarStyle(value > 120 ? "dark-content" : "light-content");
      setCurrentBarStyle(value > 120 ? "dark-content" : "light-content");
    });
    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
      <ProductCard
        key={item.product_id}
        imageUri={item.product_image}
        title={item.product_name}
        price={item.product_price}
        id={item.product_id}
        discount={item.product_discount}
        rating={item.product_rating}
      />
    </View>
  );

  if (!isConnected) {
    return <NetworkIssue onRetry={refreshNetworkStatus} />;
  }

  return (
    <View style={styles.screen}>
      {loading && products.length === 0 ? (
        <Loading />
      ) : (
        <MasonryList
          ListHeaderComponent={
            <Promos
              colours={colours}
              banners={banners}
              products={products}
              setHeaderColor={setHeaderColor}
            />
          }
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          data={products}
          numColumns={numColumns}
          keyExtractor={(item) => item.product_id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f8f9",
  },
  listContent: {
    paddingBottom: 24,
  },
  headerWrap: {
    backgroundColor: "#f8f8f9",
  },
  discoverHeader: {
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  discoverTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  discoverIconBadge: {
    backgroundColor: "#f3ece7",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.title,
  },
  discoverSubtitle: {
    fontSize: 12,
    color: Colors.subtitle,
    marginLeft: 34,
  },
  cardContainer: {
    paddingHorizontal: 5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f9",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.subtitle,
  },
});
