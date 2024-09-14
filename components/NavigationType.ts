// NavigationType.ts
import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  SellerMessages: undefined;
  SellerChat: { senderId: string };
};

export type SellerMessagesNavigationProp = StackNavigationProp<RootStackParamList, 'SellerMessages'>;
