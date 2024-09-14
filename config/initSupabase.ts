import * as SecureStore from 'expo-secure-store';
/*import 'react-native-url-polyfill-auto';*/
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey} from '../constants/index';
import Constants from 'expo-constants';

// Use a custom secure storage solution for the Supabase client to store the JWT
const ExpoSecureStoreAdapter = {
    getItem: async (key: string) => {
      try {
        const result = await SecureStore.getItemAsync(key);
        return result;
      } catch (error) {
        console.error('Error getting item from SecureStore:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('Error setting item in SecureStore:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('Error removing item from SecureStore:', error);
      }
    }
  };

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expo?.extra?.supabaseUrl;;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expo?.extra?.supabaseAnonKey;

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
        detectSessionInUrl: false,
        storage: ExpoSecureStoreAdapter,
    },
});
