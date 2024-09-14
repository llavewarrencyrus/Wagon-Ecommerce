import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { Colors } from '@/constants/Colors';
import DummySearch from '@/components/DummySearch';

import Index from '../Index';
import Cart from '../Cart';
import Category from '../Category';
import Chat from '../Chat';
import Account from '../Account';

import SellerIndex from '../SellerIndex';
import SellerProducts from '../SellerProducts';
import SellerMessages from '../SellerMessages';
import SellerAccount from '../SellerAccount';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true);

      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {

        setLoading(false);
        return;
      }

      setIsSeller(userData?.user?.email === 'seller@wagon.com');
      setLoading(false);
    };

    checkUser();
  }, [isAuthenticated]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <UserLayoutTabs />;
  }

  return isSeller ? <SellerLayoutTabs /> : <UserLayoutTabs />;
}

function UserLayoutTabs() {
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
            case 'Chat':
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
        tabBarStyle: {
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 10,
        },
      })}
    >
      <Tab.Screen name="Home" component={Index} options={{
        headerTitle: () => <DummySearch />
      }} />
      <Tab.Screen name="Category" component={Category} />
      <Tab.Screen name="Cart" component={Cart} />
      <Tab.Screen name="Chat" component={Chat} />
      <Tab.Screen name="Account" component={Account} />
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
              iconName = focused ? 'bag-handle' : 'bag-handle';
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
        tabBarStyle: {
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 10,
        },
      })}
    >
      <Tab.Screen name="Home" component={SellerIndex} options={{headerShown: true}}/>
      <Tab.Screen name="Products" component={SellerProducts} />
      <Tab.Screen name="Messages" component={SellerMessages} />
      <Tab.Screen name="Account" component={SellerAccount} />
    </Tab.Navigator>
  );
}
