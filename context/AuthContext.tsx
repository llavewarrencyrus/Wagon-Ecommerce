import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { StoreProfile } from '@/types/types';

interface AuthUser {
  id: string;
  email: string;
  username?: string;
  profile_picture?: string;
  is_seller?: boolean;
  store_name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isSeller: boolean;
  activeMode: 'buyer' | 'seller';
  storeProfile: StoreProfile | null;
  login: (user: { id: string; email: string }) => void;
  logout: () => void;
  toggleMode: () => void;
  setMode: (mode: 'buyer' | 'seller') => void;
  refreshUserProfile: () => Promise<void>;
  registerAsSeller: (storeData: Partial<StoreProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'buyer' | 'seller'>('buyer');
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setStoreProfile(data);
        const sellerFlag = !!(data.is_seller || data.store_name || data.email === 'seller@wagon.com');
        setIsSeller(sellerFlag);
        return data;
      }
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
    return null;
  };

  // Load user session and mode from AsyncStorage when the app starts
  useEffect(() => {
    const loadSession = async () => {
      const savedUser = await AsyncStorage.getItem('user');
      const savedMode = await AsyncStorage.getItem('activeMode');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        await fetchProfile(parsedUser.id);
      }

      if (savedMode === 'seller' || savedMode === 'buyer') {
        setActiveMode(savedMode);
      }
    };
    loadSession();
  }, []);

  const refreshUserProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  // Login and save session to AsyncStorage
  const login = async (userData: { id: string; email: string }) => {
    setIsAuthenticated(true);
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    const profile = await fetchProfile(userData.id);
    if (profile?.is_seller || userData.email === 'seller@wagon.com') {
      setIsSeller(true);
    }
  };

  // Logout and clear session from AsyncStorage
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out from Supabase:', error.message);
    }

    setIsAuthenticated(false);
    setUser(null);
    setIsSeller(false);
    setActiveMode('buyer');
    setStoreProfile(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('activeMode');
  };

  const toggleMode = async () => {
    const nextMode = activeMode === 'seller' ? 'buyer' : 'seller';
    setActiveMode(nextMode);
    await AsyncStorage.setItem('activeMode', nextMode);
  };

  const setMode = async (mode: 'buyer' | 'seller') => {
    setActiveMode(mode);
    await AsyncStorage.setItem('activeMode', mode);
  };

  const registerAsSeller = async (storeData: Partial<StoreProfile>): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...storeData,
          is_seller: true,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error registering seller:', error);
        return false;
      }

      setStoreProfile(data);
      setIsSeller(true);
      await setMode('seller');
      return true;
    } catch (e) {
      console.error('Registration exception:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isSeller,
        activeMode,
        storeProfile,
        login,
        logout,
        toggleMode,
        setMode,
        refreshUserProfile,
        registerAsSeller,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
