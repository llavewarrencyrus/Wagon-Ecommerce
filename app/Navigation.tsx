import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import SellerMessages from './SellerMessages';
import SellerChat from './SellerChat';
import { RootStackParamList } from '@/types/types';
import React from 'react';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="SellerMessages" component={SellerMessages} />
        <Stack.Screen name="SellerChat" component={SellerChat} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
