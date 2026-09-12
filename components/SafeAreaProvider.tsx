import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SellerMessages from '@/app/(seller)/SellerMessages';
import LoginScreen from '@/app/(auth)/LoginScreen';
import SignupScreen from '@/app/(auth)/SignupScreen';
import SellerChat from '@/app/(shared)/SellerChat';
import Chat from '@/app/(shared)/Chat';

export default function SafeArea() {
    
    return (
        <SafeAreaProvider>
            <Chat />
            <SellerMessages />
            <SellerChat />
            <LoginScreen />
            <SignupScreen />
        </SafeAreaProvider>
    );
}