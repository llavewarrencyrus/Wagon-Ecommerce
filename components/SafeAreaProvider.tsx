import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SellerMessages from '@/app/SellerMessages';
import LoginScreen from '@/app/LoginScreen';
import SignupScreen from '@/app/SignupScreen';
import SellerChat from '@/app/SellerChat';
import Chat from '@/app/Chat';

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