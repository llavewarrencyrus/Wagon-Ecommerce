import React, { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { View, Dimensions, SafeAreaView, TouchableOpacity } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { NetworkProvider } from '../components/NetworkContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFonts } from 'expo-font';
import DummySearch from '@/components/DummySearch';
import { CartProvider } from '@/context/CartProvider';
import { AddressProvider } from '@/context/AddressProvider';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          <NetworkProvider>
            <CartProvider>
              <AddressProvider>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="Category" />
                  <Stack.Screen name="Cart" options={{ headerShadowVisible: false }} />
                  <Stack.Screen name="Chat" />
                  <Stack.Screen name="LoginScreen" />
                  <Stack.Screen name="+not-found" />
                  <Stack.Screen name="Account" />
                  <Stack.Screen name="SignupScreen" options={{ animation: 'fade' }} />
                  <Stack.Screen name="ProductScreen" options={{
                    headerTitle: ' ',
                    headerTransparent: true,
                    headerBackVisible: false,
                    headerLeft: () => (
                      <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                          backgroundColor: Colors.tertiary,
                          padding: 5,
                          marginRight: 25,
                          borderRadius: 20,
                        }}
                      >
                        <AntDesign name="arrowleft" size={24} color="black" />
                      </TouchableOpacity>
                    ),
                    headerRight: () => (
                      <TouchableOpacity
                        onPress={() => router.navigate('../Cart')}
                        style={{ backgroundColor: Colors.tertiary, padding: 5, borderRadius: 20 }}
                      >
                        <Ionicons name="cart-outline" size={24} color="black" />
                      </TouchableOpacity>
                    ),
                  }} />
                  <Stack.Screen name="SearchScreen" options={{
                    headerBackVisible: false,
                    headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ padding: 5, marginRight: 25, borderRadius: 20 }}><AntDesign name="arrowleft" size={24} color="black" /></TouchableOpacity>,
                    animation: 'fade'

                  }} />
                  <Stack.Screen name="ResultScreen" />
                  <Stack.Screen name="EditProfileScreen" options={{
                    title: 'Edit Profile',
                    headerShadowVisible: false
                  }} />
                  <Stack.Screen name="NewArrival" options={{
                    headerTitle: '',
                    headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 25, borderRadius: 20 }}><AntDesign name="arrowleft" size={24} color="black" /></TouchableOpacity>,
                    headerTransparent: true
                  }} />
                  <Stack.Screen name="TopSales" options={{
                    headerTitle: '',
                    headerLeft: () => <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 25, borderRadius: 20 }}><AntDesign name="arrowleft" size={24} color="black" /></TouchableOpacity>,
                    headerTransparent: true
                  }} />
                  <Stack.Screen name="HelpCenter" />
                  <Stack.Screen name="CurrentPasswordScreen" options={{ headerTitle: 'Current Password' }} />
                  <Stack.Screen name="ChangePasswordScreen" options={{ headerTitle: 'Change Password' }} />
                  <Stack.Screen name="CheckOutScreen" />
                  <Stack.Screen name="AddressScreen" />
                  <Stack.Screen name="AddEditAddress" />
                  <Stack.Screen name="UnderConstruction" />
                </Stack>
              </AddressProvider>
            </CartProvider>
          </NetworkProvider>
        </SafeAreaView>
      </ThemeProvider>
    </AuthProvider>
  );
}
