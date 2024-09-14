
import { StackNavigationProp } from '@react-navigation/stack';


export type RootStackParamList = {
  Home: undefined;
  Product: { id: string }; 
};


export type NavigationProp = StackNavigationProp<RootStackParamList>;
