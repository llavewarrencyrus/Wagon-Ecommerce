import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartProvider";
import { Colors } from "@/constants/Colors";
import DummySearch from "@/components/DummySearch";
import { ActivityIndicator, View, Dimensions, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { HomeScreen as Index } from "@/app/(buyer)/Index";
import Cart from "@/app/(buyer)/Cart";
import Category from "@/app/(buyer)/Category";
import Account from "@/app/(buyer)/Account";

import SellerIndex from "@/app/(seller)/SellerIndex";
import SellerOrders from "@/app/(seller)/SellerOrders";
import SellerProducts from "@/app/(seller)/SellerProducts";
import SellerMessages from "@/app/(seller)/SellerMessages";
import SellerAccount from "@/app/(seller)/SellerAccount";

const { width } = Dimensions.get("window");

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const { isAuthenticated, activeMode } = useAuth();

  // Display UserLayoutTabs if not authenticated or in buyer mode
  if (!isAuthenticated || activeMode !== "seller") {
    return <UserLayoutTabs />;
  }

  // Display Seller Layout Tabs when authenticated and in seller mode
  return <SellerLayoutTabs />;
}

function UserLayoutTabs() {
  const router = useRouter();
  const { cartItems } = useCart();
  const cartCount = cartItems.length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Category":
              iconName = focused ? "grid" : "grid-outline";
              break;
            case "Cart":
              iconName = focused ? "cart" : "cart-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
            default:
              iconName = "home";
          }
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { height: 60, backgroundColor: '#fff', borderTopColor: '#f0f0f0' },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 8, fontWeight: '600' },
        tabBarIconStyle: { marginTop: 6 },
      })}>
      <Tab.Screen
        name="Home"
        component={Index}
        options={{
          headerTitle: () => (
            <View style={{ width: width * 0.68 }}>
              <DummySearch />
            </View>
          ),
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 12 }}>
              <TouchableOpacity
                onPress={() => router.push("/Cart")}
                style={tabHeaderStyles.iconBtn}
              >
                <Ionicons name="cart-outline" size={22} color={Colors.title} />
                {cartCount > 0 && (
                  <View style={tabHeaderStyles.cartBadge}>
                    <Text style={tabHeaderStyles.cartBadgeText}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/Chat")}
                style={[tabHeaderStyles.iconBtn, { marginLeft: 6 }]}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={Colors.title} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Category"
        component={Category}
        options={{
          headerTitle: () => (
            <View style={{ width: width * 0.78 }}>
              <DummySearch />
            </View>
          ),
          headerStyle: {
            backgroundColor: "white",
          },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/Chat")}
              style={{ backgroundColor: "#f3ece7", padding: 7, marginRight: 15, borderRadius: 20 }}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={Cart}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.primary, fontSize: 10 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Account}
        options={{ headerShadowVisible: false }}
      />
    </Tab.Navigator>
  );
}

const tabHeaderStyles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

function SellerLayoutTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Orders":
              iconName = focused ? "cube" : "cube-outline";
              break;
            case "Products":
              iconName = focused ? "bag-handle" : "bag-handle-outline";
              break;
            case "Messages":
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
              break;
            case "Store":
              iconName = focused ? "storefront" : "storefront-outline";
              break;
            default:
              iconName = "home";
          }
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: "#5C3A2E",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: { height: 60, backgroundColor: "#FFF" },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 8, fontWeight: "600" },
        tabBarIconStyle: { marginTop: 8 },
      })}>
      <Tab.Screen
        name="Home"
        component={SellerIndex}
      />
      <Tab.Screen
        name="Orders"
        component={SellerOrders}
      />
      <Tab.Screen
        name="Products"
        component={SellerProducts}
      />
      <Tab.Screen
        name="Messages"
        component={SellerMessages}
      />
      <Tab.Screen
        name="Store"
        component={SellerAccount}
      />
    </Tab.Navigator>
  );
}
