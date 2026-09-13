import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Image, TouchableOpacity } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";

import NetworkIssue from "@/components/NetworkIssue";
import { useNetwork } from "@/components/NetworkContext";

import { getCategoryList } from "@/data/data";
import { Colors } from "@/constants/Colors";
import DummySearch from "@/components/DummySearch";
import Loading from "@/components/Loading";

import { useWidth } from "@/context/WidthContext";

const Tab = createMaterialTopTabNavigator();

const CategoryScreen = () => {
  const { isConnected, refreshNetworkStatus } = useNetwork();
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMainCategories = async () => {
      const categories = await getCategoryList(null);
      if (categories && categories.length > 0) {
        setMainCategories(categories);
      } else {
        // Fallback default categories if category table is empty
        setMainCategories([
          { id: 1, name: "Men's Apparel" },
          { id: 2, name: "Women's Apparel" },
          { id: 3, name: "Electronics" },
          { id: 4, name: "Footwear" },
          { id: 5, name: "Bags & Accessories" },
          { id: 6, name: "Home & Living" },
        ]);
      }
      setLoading(false);
    };
    fetchMainCategories();
  }, []);

  if (!isConnected) {
    return <NetworkIssue onRetry={refreshNetworkStatus} />;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {mainCategories.length > 0 ? (
        <Tab.Navigator
          screenOptions={{
            tabBarScrollEnabled: true,
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: styles.indicator,
            tabBarItemStyle: styles.tab,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: "#6b7280",
            tabBarLabelStyle: styles.tabLabel,
            tabBarPressColor: "transparent",
          }}>
          {mainCategories.map((category: any) => {
            const categoryName = category.name || category.category || `Category ${category.id}`;
            return (
              <Tab.Screen
                key={category.id}
                name={categoryName}
                options={{
                  tabBarLabel: categoryName,
                }}
                children={() => (
                  <SubcategoryScreen
                    parentId={category.id}
                    mainCategory={categoryName}
                  />
                )}
              />
            );
          })}
        </Tab.Navigator>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories available.</Text>
        </View>
      )}
    </>
  );
};

const SubcategoryScreen = ({ parentId, mainCategory }: { parentId: number; mainCategory: string }) => {
  const width = useWidth();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetched, setIsFetched] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!isFetched) {
        const fetchSubcategories = async () => {
          setLoading(true);
          const categories = await getCategoryList(parentId);
          if (categories && categories.length > 0) {
            setSubcategories(categories);
          } else {
            // Contextual fallback subcategories based on mainCategory
            const sampleSubMap: Record<string, string[]> = {
              "Men's Apparel": ["Hoodies & Sweatshirts", "T-Shirts", "Jackets", "Streetwear", "Pants"],
              "Women's Apparel": ["Dresses", "Tops", "Skirts", "Outerwear", "Activewear"],
              Electronics: ["Audio & Headphones", "Gadgets", "Smartwatches", "Accessories"],
              Footwear: ["Sneakers", "Running Shoes", "Loafers", "Sandals"],
              "Bags & Accessories": ["Tote Bags", "Backpacks", "Watches", "Wallets"],
              "Home & Living": ["Home Fragrance", "Decor", "Lamps", "Kitchen"],
            };
            const defaultSubs = sampleSubMap[mainCategory] || ["All Items", "Featured", "Best Sellers"];
            setSubcategories(
              defaultSubs.map((name, idx) => ({
                id: parentId * 100 + idx,
                name,
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80",
              }))
            );
          }
          setLoading(false);
          setIsFetched(true);
        };
        fetchSubcategories();
      }
    }, [parentId, isFetched, mainCategory])
  );

  if (loading && !isFetched) {
    return <Loading />;
  }

  const handleOnPress = (subcategory: any) => {
    const subName = subcategory.name || subcategory.category || "";
    router.push(`/ResultScreen?category=${encodeURIComponent(subName || mainCategory)}`);
  };

  return (
    <View style={styles.subcategoryContainer}>
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const title = item.name || item.category || "Category";
          return (
            <Pressable
              style={[styles.item, { width: width / 2 - 16 }]}
              onPress={() => handleOnPress(item)}>
              <View style={styles.itemInner}>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={styles.iconPlaceholder}>
                    <Ionicons
                      name="pricetag-outline"
                      size={32}
                      color={Colors.primary}
                    />
                  </View>
                )}
                <Text
                  style={styles.itemTitle}
                  numberOfLines={2}>
                  {title}
                </Text>
              </View>
            </Pressable>
          );
        }}
        numColumns={2}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  indicator: {
    backgroundColor: Colors.primary,
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "none",
  },
  subcategoryContainer: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f8f8f9",
  },
  tab: {
    width: "auto",
    paddingHorizontal: 14,
  },
  item: {
    height: 140,
    margin: 4,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    elevation: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  itemInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: "cover",
    marginBottom: 8,
  },
  iconPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#f3ece7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.title,
    textAlign: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.subtitle,
  },
});

export default CategoryScreen;
