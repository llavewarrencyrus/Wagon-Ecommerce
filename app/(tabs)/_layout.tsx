import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import DummySearch from '@/components/DummySearch';
import { ActivityIndicator, View, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { HomeScreen as Index } from '../Index';
import Cart from '../Cart';
import Category from '../Category';
import Account from '../Account';

import SellerIndex from '../SellerIndex';
import SellerProducts from '../SellerProducts';
import SellerMessages from '../SellerMessages';
import SellerAccount from '../SellerAccount';

const { width } = Dimensions.get('window');

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  

  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);
      
      // Check if there's a logged-in user
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      // Check if user is a seller
      const { data: userData, error } = await supabase.auth.getUser();
      if (!error && userData?.user?.email === 'seller@wagon.com') {
        setIsSeller(true);
      }

      setLoading(false);
    };

    checkUser();
  }, [isAuthenticated, user]);

  // Show loading indicator during authentication check
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.icon} />
      </View>
    );
  }

  // Display UserLayoutTabs if not authenticated
  if (!isAuthenticated) {
    return <UserLayoutTabs />;
  }

  // Display Seller or User Layout Tabs based on the user's type
  return isSeller ? <SellerLayoutTabs /> : <UserLayoutTabs />;
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
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Category':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Cart':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.icon,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 10 },
        tabBarIconStyle: { marginTop: 10 },
      })}
    >
      <Tab.Screen name="Home" component={Index} options={{
        headerTitle: () => <View style={{ width: width * 0.80 }}><DummySearch /></View>,
        headerShadowVisible: false,
      }} />
      <Tab.Screen name="Category" component={Category} options={{
        headerTitle: () => <View style={{ width: width * 0.80 }}><DummySearch /></View>,
        headerStyle: {
          backgroundColor: 'white',
        },
        headerShadowVisible: false,
        headerRight: () => <TouchableOpacity onPress={() => router.navigate('../Chat')} style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight:15, borderRadius: 20 }}><Ionicons name="chatbubbles-outline" size={24} color="black" /></TouchableOpacity>,
      }}/>
      <Tab.Screen name="Cart" component={Cart} />
      <Tab.Screen name="Profile" component={Account} options={{ headerShadowVisible: false }} />
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
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Products':
              iconName = focused ? 'bag-handle' : 'bag-handle-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Account':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.icon,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 10 },
        tabBarIconStyle: { marginTop: 10 },
      })}
    >
      <Tab.Screen name="Home" component={SellerIndex} options={{ headerShown: true }} />
      <Tab.Screen name="Products" component={SellerProducts} />
      <Tab.Screen name="Messages" component={SellerMessages} />
      <Tab.Screen name="Account" component={SellerAccount} />
    </Tab.Navigator>
  );
}
