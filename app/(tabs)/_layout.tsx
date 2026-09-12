import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import DummySearch from "@/components/DummySearch";
import { ActivityIndicator, View, Dimensions, TouchableOpacity } from "react-native";
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
              iconName = focused ? "search" : "search-outline";
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
        tabBarActiveTintColor: Colors.icon,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 10 },
        tabBarIconStyle: { marginTop: 10 },
      })}>
      <Tab.Screen
        name="Home"
        component={Index}
        options={{
          headerTitle: () => (
            <View style={{ width: width * 0.8 }}>
              <DummySearch />
            </View>
          ),
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="Category"
        component={Category}
        options={{
          headerTitle: () => (
            <View style={{ width: width * 0.8 }}>
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
              style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 15, borderRadius: 20 }}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color="black"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={Cart}
      />
      <Tab.Screen
        name="Profile"
        component={Account}
        options={{ headerShadowVisible: false }}
      />
    </Tab.Navigator>
  );
}

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
