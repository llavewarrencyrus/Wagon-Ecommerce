import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { View, Dimensions } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '../components/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import DummySearchBar from '@/components/DummySearch';
/*import { AuthProvider } from '@/provider/AuthProvider';*/

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

export default function RootLayout() {
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
          <Stack.Screen name="LoginScreen" options={{ headerShown: false}}/>
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="Account" />
          <Stack.Screen name="SignupScreen" options={{ headerShown: false }}/>
          <Stack.Screen name="ProductScreen" options={{
            headerTitle: () => <View style={{width: width * 0.75}}><DummySearchBar/></View>,
            headerStyle: {
              backgroundColor: 'white',
            },
          }}/>
          <Stack.Screen name="SearchScreen" />
          <Stack.Screen name="UnderConstruction" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
